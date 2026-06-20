fetch("/registered-units")
.then(res => res.json())
.then(data => {

const div =
document.getElementById(
"registeredUnits"
);

div.innerHTML = "";

if (data.length === 0) {

div.innerHTML = `
  <div class="card">
    No units registered.
  </div>
`;

return;

}

data.forEach(unit => {

div.innerHTML += `
  <div class="card">

    <div class="unit-code">
      ${unit.unit_code}
    </div>

    <div class="unit-name">
      ${unit.unit_name || ""}
    </div>

  </div>
`;

});

})
.catch(err => {

console.error(err);

});
