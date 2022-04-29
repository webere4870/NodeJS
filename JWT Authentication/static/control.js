

let jwt;

$('#register').submit(async (evt)=>
{
    evt.preventDefault()
    let username = $("#username").text();
    let password = $("#password").text();
    let userObject = {username: username, password: password}
    let res = await fetch('/register',
    {
        method: 'POST',
        body: JSON.stringify(userObject),
        headers: {'Content-Type': 'application/json'}
    })
    let json = await res.json()
    jwt = json.token
    console.log(json)
})