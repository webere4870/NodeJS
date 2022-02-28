import { io } from 'socket.io-client'

const socket = io('http://localhost:3000')

$('#form').submit((evt)=>{
    evt.preventDefault()
    let message = $('#message').val();
    let room = $('#room').val();

    if(message === "") return
console.log('adf')
    displayMessage(message)

    console.log('here')
})

$('#room').click((evt)=>
{
    const room = $('#room').val();
})

function displayMessage(message)
{
    let messageNew = document.createElement('div')
    messageNew.textContent = message;
    document.querySelector('#messages').appendChild(messageNew)
}