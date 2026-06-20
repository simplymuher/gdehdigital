/*
------------------------------------
Auto Fill Remembered Login
------------------------------------
*/

window.onload = () => {

const savedName =
localStorage.getItem("studentName");

const savedReg =
localStorage.getItem("regNumber");

if(savedName){

document.getElementById(
"studentName"
).value = savedName;

}

if(savedReg){

document.getElementById(
"regNumber"
).value = savedReg;

}

};

/*
------------------------------------
Login
------------------------------------
*/

document
.getElementById("loginForm")
.addEventListener(
"submit",
async (e)=>{

e.preventDefault();

const studentName =
document.getElementById(
"studentName"
).value;

const regNumber =
document.getElementById(
"regNumber"
).value;

const remember =
document.getElementById(
"rememberMe"
).checked;

const response =
await fetch(
"/login",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
studentName,
regNumber
})
}
);

const data =
await response.json();

if(data.success){

if(remember){

localStorage.setItem(
"studentName",
studentName
);

localStorage.setItem(
"regNumber",
regNumber
);

}
else{

localStorage.removeItem(
"studentName"
);

localStorage.removeItem(
"regNumber"
);

}

window.location =
"/dashboard.html";

}
else{

alert(
"Invalid Login Credentials"
);

}

});
