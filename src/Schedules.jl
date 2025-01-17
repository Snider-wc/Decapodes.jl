""" Schedules

This module contains the tooling which converts diagrams to DWDs.

*TODO* This module will also include optimization tooling relating to DWD
schedules (compressing matrix operations, pre-computing constant values, etc).
"""
module Schedules
using Catlab.Syntax
using Catlab.WiringDiagrams.DirectedWiringDiagrams
using Catlab.Theories
using Catlab.CategoricalAlgebra
using Catlab.Programs.DiagrammaticPrograms: NamedGraph

using ..Diagrams

export diag2dwd

sp_otimes(expr) = expr isa ObExpr{:otimes} ? expr.args : [expr]
n_args(expr) = length(sp_otimes(expr))

isa_proj(hom) = startswith(string(hom), "proj")
proj_ind(hom) = unsub(split(string(hom), "_")[1][5:end])

super2int = Dict(
  '⁰'=>'0', '¹'=>'1', '²'=>'2', '³'=>'3', '⁴'=>'4', '⁵'=>'5',
  '⁶'=>'6', '⁷'=>'7', '⁸'=>'8', '⁹'=>'9'
)
sub2int = Dict(
  '₀'=>'0', '₁'=>'1', '₂'=>'2', '₃'=>'3', '₄'=>'4', '₅'=>'5',
  '₆'=>'6', '₇'=>'7', '₈'=>'8', '₉'=>'9'
)

unsub(str) = begin
  parse(Int64, join([sub2int[a] for a in str]))
end

function eval_deps!(dwd, graph, el, w2b, el2p, obs; in_els = Dict{Int, Int}(), boundaries = [])
  if el in keys(el2p)
    return el2p[el]
  end

  inputs = incident(graph, el, :tgt)

  labels = graph[:ename]
  el_types = sp_otimes(obs[el])
  outp = if length(inputs) > 1
    sort!(inputs, by = i->proj_ind(labels[i]))
    vcat(map(w -> eval_deps!(dwd, graph, graph[w, :src], w2b, el2p, obs; in_els = in_els), inputs)...)
  elseif length(inputs) == 0
    el ∈ keys(in_els) || error("Element $el has no dependencies, but is not defined in `in_els`")
    [(input_id(dwd), in_els[el])]
  else
    in_ps = eval_deps!(dwd, graph, graph[inputs[1], :src], w2b, el2p, obs; in_els = in_els)
    if isa_proj(graph[inputs[1], :ename])
      [in_ps[proj_ind(graph[inputs[1], :ename])]]
    else
      wires = map(enumerate(in_ps)) do (ip, op)
        Wire(port_value(dwd, Port(op[1], OutputPort, op[2])), op, (w2b[inputs[1]], ip))
      end
      add_wires!(dwd, wires)
      map(1:length(output_ports(dwd, w2b[inputs[1]]))) do p
        (w2b[inputs[1]], p)
      end
    end
  end

  if el in keys(el2p)
    return el2p[el]
  end

  # Evaluate Boundary Conditions
  bcs = incident(graph, el, :src)
  filter!(a->"$(Symbol(graph[a, :ename]))"[1] == '∂', bcs)
  for bc in bcs
    wires = map(enumerate(outp)) do (ip, op)
      Wire(port_value(dwd, Port(op[1], OutputPort, op[2])), op, (w2b[bc], ip))
    end
    add_wires!(dwd, wires)
    outp .= map(1:length(output_ports(dwd, w2b[bc]))) do p
      (w2b[bc], p)
    end
  end
  el2p[el] = outp
  outp
end

name(a::HomExpr) = head(a) == :generator ? args(a)[1] : head(a)

""" diag2dwd(diagram; clean = false, calc_states = [], out_vars=[], in_vars=[])

Generates a directed wiring diagram (DWD) from a Decapode `diagram`. This
method generates a DWD which represents a single explicit time step of the
system, computed by the dependency graph of each time derivative within the
system. This does not necessarily work for all Decapodes, and only generates
an explicit time-step solution.

*TODO*: Functions like this can be created to generate other solution styles,
like implicit solutions.
"""
function diag2dwd(diagram; clean = false, calc_states = [], out_vars=[], in_vars=[])
  homs = Vector{Any}(copy(diagram.hom_map))
  obs = Vector{Any}(copy(diagram.ob_map))
  graph = NamedGraph{Any, Any}()
  copy_parts!(graph, dom(diagram).graph)
  graph[:ename] .= homs


  flipped = fill(false, ne(graph))
  # Flip projections for graph eval
  for (i, h) in enumerate(homs)
    if isa_proj(h) && !flipped[i]
      iw = copy(incident(graph, graph[i, :src], :tgt))
      ow = copy(incident(graph, graph[i, :src], :src))
      if isempty(iw)
        for w in ow
          if isa_proj(homs[w]) && !flipped[w]
            wsrc = graph[w, :src]
            graph[w, :src] = graph[w, :tgt]
            graph[w, :tgt] = wsrc
            flipped[w] = true
          end
        end
      end
    end
  end

  # Expand homs which are composition
  comp_to_remove = []
  for h in parts(graph, :E)
    h_name = graph[h, :ename]
    elsrc, eltgt = graph[h, :src], graph[h, :tgt]
    if h_name isa HomExpr{:compose}
      args = h_name.args
      push!(comp_to_remove, h)
      verts = add_parts!(graph, :V, length(args) - 1, vname = [Symbol("anon_", gensym()) for i in 1:(length(args)-1)])
      append!(obs, codom.(args)[1:(end-1)])
      add_parts!(graph, :E, length(args), ename = args,
                          src = vcat([elsrc], verts),
                          tgt = vcat(verts, [eltgt]))
    end
  end
  rem_parts!(graph, :E, comp_to_remove)


  pres = presentation(codom(diagram))

  # Decide on State and Parameter variables
  time_arrs = findall(h-> h isa HomExpr{:∂ₜ}, graph[:ename])
  params = findall(e -> isempty(incident(graph, e, :tgt)), parts(graph, :V))
  state_vals = graph[time_arrs, :src]

  # Mix State and Parameters into single in_els (need to ensure alignment between input and outputs
  in_els = unique(vcat(state_vals, params))
  out_els = copy(graph[time_arrs, :tgt])
  out_names = [Symbol(:∂ₜ, graph[v, :vname]) for v in state_vals]


  # TODO: Establish some kind of consistency expectations here
  if !isempty(in_vars) && !isempty(out_vars)
    in_els = [incident(graph, a, :vname) for a in in_vars]
    out_els = [incident(graph, a, :vname) for a in out_vars]
    out_names = graph[out_els, :vname]
  elseif !isempty(in_vars)
    # This ensures that the output values are in-order with input values
    new_inds = [findfirst(v -> graph[v, :vname] == a, in_els) for a in in_vars]
    non_param_inds = filter(i -> in_els[i] in state_vals , new_inds)
    in_els .= in_els[new_inds]
    out_els .= out_els[non_param_inds]
    out_names .= out_names[non_param_inds]
  elseif !isempty(out_vars)
    out_els = [incident(graph, a, :vname) for a in out_vars]
    out_names = graph[out_els, out_els]
  end
  if !isempty(calc_states)
    calc_inds = findall(v->graph[v, :vname] ∈ calc_states, state_vals)
    out_els = out_els[calc_inds]
    out_names = out_names[calc_inds]
  end

  in_types = [Dict(:name => graph[v, :vname],
                   :type => obs[v])
              for v in in_els]
  out_types = [Dict(:name => out_names[v],
                    :type => obs[out_els[v]])
               for v in 1:length(out_els)]

  # FIXME: Hacky solution to ensuring time_arrs aren't included later
  # need more thoughtful approach to sorting through edges here
  rem_parts!(graph, :E, time_arrs)

  dwd = WiringDiagram(collect(in_types), collect(out_types))

  # Add all necessary boxes to the DWD based on arrows in the diagram
  w2b = map(parts(graph, :E)) do a
    w_type = graph[a, :ename]
    # Fix this if-case. This was meant for times when multiple arguments would
    # go into a single box
    if isa_proj(w_type)
      nothing
    elseif w_type isa HomExpr
      src_el = graph[a, :src]
      tgt_el = graph[a, :tgt]
      in_ports = sp_otimes(obs[src_el])
      out_ports = sp_otimes(obs[tgt_el])
      add_box!(dwd, Box(name(w_type), [Dict(:type=>ip) for ip in in_ports],
                        [Dict(:type=>op) for op in out_ports]))
    end
  end

  # Mapping from elements (vertices in `graph`) to ports in the DWD
  # This ensures that elements which have already been computed are
  # not recomputed
  el2p = Dict{Int, Vector}()
  in_ps = vcat(map(out_els) do el
    eval_deps!(dwd, graph, el, w2b, el2p, obs; in_els=Dict(in_els[i] => i for i in 1:length(in_els)))
  end...)

  wires = map(enumerate(in_ps)) do (ip, op)
    Wire(out_types[ip], op, (output_id(dwd), ip))
  end
  add_wires!(dwd, wires)

  # Remove any boxes without any connecting wires
  if clean
    to_rem = Vector{Int64}()
    for b in 1:nparts(dwd.diagram, :Box)
      if isempty(vcat(incident(dwd.diagram, b, [:tgt, :in_port_box]),
                      incident(dwd.diagram, b, [:in_tgt, :in_port_box]))) &&
         isempty(vcat(incident(dwd.diagram, b, [:src, :out_port_box]),
                      incident(dwd.diagram, b, [:out_src, :out_port_box])))
         push!(to_rem, b)
      end
    end
    rem_boxes!(dwd, to_rem)
  end

  dwd
end

diag2dwd(simple_diagram::T; args...) where {T <: SimpleDiagram} =
  diag2dwd(diagram(simple_diagram); args...)


end
