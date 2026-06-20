fetch("/units")
.then(res=>res.json())
.then(data=>{

const container =
document.getElementById("units");

data.forEach(unit=>{

container.innerHTML += `
<div class="unit">

<input
type="checkbox"
name="units"
value="${unit.unit_code}"
>

${unit.unit_code}
-
${unit.unit_name}

</div>
`;

});

});

document
.getElementById("unitForm")
.addEventListener("submit",async e=>{

e.preventDefault();

const units = [];

document
.querySelectorAll(
'input[name="units"]:checked'
)
.forEach(box=>{

units.push(box.value);

});

await fetch(
"/register-units",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({units})
}
);

alert("Units Registered");

});
