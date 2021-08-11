var documenterSearchIndex = {"docs":
[{"location":"api/#Library-Reference","page":"Library Reference","title":"Library Reference","text":"","category":"section"},{"location":"api/#Tonti-Diagrams","page":"Library Reference","title":"Tonti Diagrams","text":"","category":"section"},{"location":"api/","page":"Library Reference","title":"Library Reference","text":"Modules = [ Decapods.TontiDiagrams ]\nPrivate = false","category":"page"},{"location":"api/#Decapods.TontiDiagrams.TheoryTontiDiagram","page":"Library Reference","title":"Decapods.TontiDiagrams.TheoryTontiDiagram","text":"ACSet definition for a Tonti diagram.\n\nThis diagram is visualized in the q.uiver framework here. This Tonti diagram definition is currently very close to the simulation level and generalized away from the DEC tooling. Future work will be done to provide a closer integration between Tonti diagrams and DEC.\n\nSee Catlab.jl documentation for a description of the @present syntax.\n\n\n\n\n\n","category":"constant"},{"location":"api/#Decapods.TontiDiagrams.Space","page":"Library Reference","title":"Decapods.TontiDiagrams.Space","text":"Space\n\nStructure for storing the computed values for the primal/dual complex, the boundary operators, the hodge stars, the laplacian operators, and the lie operators. This is the operator which provides the DEC connection for the Tonti diagra tooling.\n\nAccessing the boundary, hodge, and laplacian operators is slightly complicated by using arrays in a 1-indexed system. The hodge and boundary operators are accessed with two indices, where the first determines the complex (1 for primal and 2 for dual) and the second determines the dimension (1 for 0-forms, 2 for 1-forms, 3 for 2-forms, etc.). Thus, the boundary operator from dual 1-forms to dual 2-forms is given as:\n\nsp = Space(s)\nsp.boundary[2,2]\n\nThe other goal of this structure is to cache the computed operators, yet optimally this caching should be perfomed during the vectorfield operation.\n\n\n\n\n\n","category":"type"},{"location":"api/#Decapods.TontiDiagrams.Space-Union{Tuple{Catlab.CSetDataStructures.AttributedCSet{Catlab.Theories.CatDesc{(:V, :E, :Tri), (:src, :tgt, :∂e0, :∂e1, :∂e2), (2, 2, 3, 3, 3), (1, 1, 2, 2, 2)}, Catlab.Theories.AttrDesc{Catlab.Theories.CatDesc{(:V, :E, :Tri), (:src, :tgt, :∂e0, :∂e1, :∂e2), (2, 2, 3, 3, 3), (1, 1, 2, 2, 2)}, (:Orientation, :Point), (:edge_orientation, :tri_orientation, :point), (2, 3, 1), (1, 1, 2)}, Tuple{O, P}, (:src, :tgt, :∂e0, :∂e1, :∂e2), (), Tables, Indices} where {Tables<:NamedTuple, Indices<:NamedTuple}}, Tuple{P}, Tuple{O}} where {O, P}","page":"Library Reference","title":"Decapods.TontiDiagrams.Space","text":"Space(s::EmbeddedDeltaSet3D)\n\nCaclulates all of the values stored in the Space object for a given complex s.\n\n\n\n\n\n","category":"method"},{"location":"api/#Decapods.TontiDiagrams.TontiDiagram-Tuple{}","page":"Library Reference","title":"Decapods.TontiDiagrams.TontiDiagram","text":"TontiDiagram()\n\nInitialize an empty TontiDiagram object.\n\n\n\n\n\n","category":"method"},{"location":"api/#Decapods.TontiDiagrams.Open-Tuple{Any, Vararg{Any, N} where N}","page":"Library Reference","title":"Decapods.TontiDiagrams.Open","text":"Open(td::TontiDiagram, states::Symbol)\n\nGenerates an OpenTontiDiagram with cospan legs on variables defined by the symbols included in states. This OpenTontiDiagram can then be composed with other OpenTontiDiagrams over a pattern given by an undirected wiring diagram.\n\nOpenTontiDiagram(td, :x, :v)\n\n\n\n\n\n","category":"method"},{"location":"api/#Decapods.TontiDiagrams.add_bc!-Tuple{Any, Any, Any}","page":"Library Reference","title":"Decapods.TontiDiagrams.add_bc!","text":"addbc!(td::TontiDiagram, varsys::Symbol, func::Function)\n\nAdds a \"boundary condition\" to the variable var_sys by applying func to the values of this variable during simulation. This function is the last one evaluated on the data of the variable var_sys, and so can be used to enforce any relevant boundary conditions.\n\nTODO: Add time dependency of boundary condition function to allow for time-varying BCs.\n\n\n\n\n\n","category":"method"},{"location":"api/#Decapods.TontiDiagrams.add_derivative!-NTuple{4, Any}","page":"Library Reference","title":"Decapods.TontiDiagrams.add_derivative!","text":"addderivative!(td::TontiDiagram, sp::Space, domsym::Symbol, codom_sym::Symbol)\n\nAdds a derivative transition from variable dom_sym to variable codom_sym using the boundary operators from sp. This function determines which boundary operator to use and inserts an appropriate transition between the two variables.\n\nDefining a spatial derivative relationship between the primal 0-form x and the primal 1-form Δx cis given as follows:\n\nadd_derivative(td, sp, :x, :Δx)\n\n\n\n\n\n","category":"method"},{"location":"api/#Decapods.TontiDiagrams.add_derivatives!-Tuple{Any, Any, Vararg{Pair{Symbol, Symbol}, N} where N}","page":"Library Reference","title":"Decapods.TontiDiagrams.add_derivatives!","text":"add_derivatives!(td::TontiDiagram, sp::Space, vars:Pair{Symbol, Symbol}...)\n\nAdds multiple derivative transition between pairs of variables, using the same syntax as in add_derivative!.\n\nExample usage:\n\nadd_derivatives!(td, sp, (:x,:Δx), (:y, :Δy))\n\n\n\n\n\n","category":"method"},{"location":"api/#Decapods.TontiDiagrams.add_laplacian!-NTuple{4, Any}","page":"Library Reference","title":"Decapods.TontiDiagrams.add_laplacian!","text":"addlaplacian!(td::TontiDiagrams, sp::Space, domsym::Symbol, codom_sym::Symbol; coef::Float64)\n\nAdds a transition which defines codom_sym as the laplacian of dom_sym with a constant scaling factor of coef.\n\n\n\n\n\n","category":"method"},{"location":"api/#Decapods.TontiDiagrams.add_time_dep!-Tuple{Any, Symbol, Symbol}","page":"Library Reference","title":"Decapods.TontiDiagrams.add_time_dep!","text":"addtimedep!(td::TontiDiagram, derivsym::Symbol, integsym::Symbol)\n\nAdds a time derivative relationship between the variables deriv_sym and integ_sym (where deriv_sym is the time derivative of integ_sym). These relationships are used to determine the state-variables of the system.\n\n\n\n\n\n","category":"method"},{"location":"api/#Decapods.TontiDiagrams.add_transition!-Tuple{Any, Vector{Symbol}, Any, Vector{Symbol}}","page":"Library Reference","title":"Decapods.TontiDiagrams.add_transition!","text":"addtransition!(td, domsym::Vector{Symbol}, func!, codom_sym::Vector{Symbol})\n\nAdds a transition function from variables dom_sym to variables codom_sym with its transition defined by func!. func! is expected to have the signature func(codom_sym..., dom_sym...) and is expected to modify the values of the codom_sym variables.\n\nDefining a transition from variables x and y to m that calculates the magnitude of the values in x and y as vector coordinates would be defined as:\n\ntd = TontiDiagram()\nadd_variables!(td, (:x, 0, 1), (:y, 0, 1). (:m, 0, 1))\nadd_transition!(td, [:x, :y], (m,x,y)->(m .= sqrt.(x .* y)), [:m])\n\n\n\n\n\n","category":"method"},{"location":"api/#Decapods.TontiDiagrams.add_variable!-Tuple{Any, Symbol, Int64, Bool}","page":"Library Reference","title":"Decapods.TontiDiagrams.add_variable!","text":"add_variable!(td:TontiDiagram, symbol::Symbol, dimension::Int64, complex::Bool)\n\nAdds a variable to the TontiDiagram system which can later be referenced by its symbol. This constructor requires the dimensionality of the variable (0 -> point, 1 -> line, etc.) and the complex it is defined on (true -> primal/straight, false -> dual/twisted).\n\nDefiniting a system with a variable v defined on the primal lines would be constructed as:\n\ntd = TontiDiagram()\nadd_variable!(td, :v, 1, true)\n\n\n\n\n\n","category":"method"},{"location":"api/#Decapods.TontiDiagrams.add_variables!-Tuple{Any, Vararg{Tuple{Symbol, Int64, Bool}, N} where N}","page":"Library Reference","title":"Decapods.TontiDiagrams.add_variables!","text":"add_variables!(td:TontiDiagram, vars::Tuple{Symbol, Int64, Bool}...)\n\nAdds multiple variables to the TontiDiagram system which can later be referenced by their symbols. This constructor follows the same pattern as add_variable! with each variable specified as a tuple of:\n\n(symbol, dimension, complex)\n\nDefining a system with a variable v defined on the primal lines, a variable p̃ defined on the dual surfaces, and a variable C defined on the primal surfaces would be constructed as:\n\ntd = TontiDiagram()\nadd_variables!(td, (:v, 1, true), (:p̃, 1, true), (:C, 2, true))\n\n\n\n\n\n","category":"method"},{"location":"api/#Decapods.TontiDiagrams.gen_form-Tuple{Catlab.CSetDataStructures.AttributedCSet{Catlab.Theories.CatDesc{(:V, :E, :Tri), (:src, :tgt, :∂e0, :∂e1, :∂e2), (2, 2, 3, 3, 3), (1, 1, 2, 2, 2)}, Catlab.Theories.AttrDesc{Catlab.Theories.CatDesc{(:V, :E, :Tri), (:src, :tgt, :∂e0, :∂e1, :∂e2), (2, 2, 3, 3, 3), (1, 1, 2, 2, 2)}, (:Orientation, :Point), (:edge_orientation, :tri_orientation, :point), (2, 3, 1), (1, 1, 2)}, Tuple{Orientation, Point}, (:src, :tgt, :∂e0, :∂e1, :∂e2), (), Tables, Indices} where {Orientation, Point, Tables<:NamedTuple, Indices<:NamedTuple}, Function}","page":"Library Reference","title":"Decapods.TontiDiagrams.gen_form","text":"Construct a 0-form based on a scalar function\n\nThis operator accepts a scalar function and evaulates it at each point on the simplex, returning a 0-form.\n\n\n\n\n\n","category":"method"},{"location":"api/#Decapods.TontiDiagrams.vectorfield-Tuple{Any, Decapods.TontiDiagrams.Space}","page":"Library Reference","title":"Decapods.TontiDiagrams.vectorfield","text":"vectorfield(td::AbstractTontiDiagram, sp::Space)\n\nGenerates a Julia function which calculates the vectorfield of the Tonti diagram. The state of the system is defined by a single vector which is a flattening of all state variables of the system. Thus, this function returns both the indices of each variable in the state-vector along with the vectorfield function itself.\n\nThe resulting function has a signature of the form f!(du, u, p, t) and can be passed to the DifferentialEquations.jl solver package.\n\n\n\n\n\n","category":"method"},{"location":"#Decapods.jl","page":"Decapods.jl","title":"Decapods.jl","text":"","category":"section"},{"location":"","page":"Decapods.jl","title":"Decapods.jl","text":"Decapods are a graphical tool for the composition of physical systems. Ultimately, this library will include tooling which takes advantage of the formalization of physical theories described by DEC provided by CombinatorialSpaces.jl.","category":"page"},{"location":"#NOTE","page":"Decapods.jl","title":"NOTE","text":"","category":"section"},{"location":"","page":"Decapods.jl","title":"Decapods.jl","text":"This library is currently under active development, and so is not yet at a point where a constant API/behavior can be assumed. That being said, if this project looks interesting/relevant please contact us and let us know!","category":"page"}]
}
