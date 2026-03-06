const API="http://127.0.0.1:8000/api"

export const getDistricts=()=>fetch(`${API}/districts`).then(r=>r.json())

export const getTehsils=(district)=>
fetch(`${API}/tehsils?district=${district}`).then(r=>r.json())

export const getMouzas=(tehsil)=>
fetch(`${API}/mouzas?tehsil=${tehsil}`).then(r=>r.json())

export const getKhasras=(mouza)=>
fetch(`${API}/khasras?mouza=${mouza}`).then(r=>r.json())