document
.getElementById("forgotForm")
.addEventListener(
"submit",
async e => {

e.preventDefault();

const email =
document
.getElementById("email")
.value
.trim();

try {

const response =
  await fetch(
    "/forgot-registration",
    {
      method: "POST",

      headers: {
        "Content-Type":
        "application/json"
      },

      body: JSON.stringify({
        email
      })
    }
  );

const data =
  await response.json();

document
.getElementById("message")
.innerHTML =
  data.message ||
  "Verification link sent to your email.";

} catch (err) {

console.error(err);

document
.getElementById("message")
.innerHTML =
  "Failed to send verification link.";

}

});
