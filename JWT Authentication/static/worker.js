let count = 0;
for(let counter = 0; counter < 1000; counter++)
{
    count = counter;
}
postMessage(count);

onmessage = (event)=>
{
    console.log(event.data)
}