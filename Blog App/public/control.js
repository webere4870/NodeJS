document.addEventListener('DOMContentLoaded', ()=>
    {
        let butty = document.querySelector('#searchButton')
    if(butty)
    {

        
        document.querySelector('#searchButton').addEventListener("click", query)

    }
    async function query ()
    {
        let search = $('#search')
        let newQuery = await fetch('/search/'+search.value)
        let articlesTemp = await newQuery.json()
        let {data} = articlesTemp
        let articles = data
        console.log(articles)
        let removeArticles = document.querySelectorAll('#articleHolder > a')
        
        for(let counter = 0; counter < articles.length; counter++)
        {
            console.log("herefa")
            let a = document.createElement('a')
            a.href = "/article/"+articles[counter].title
            let card = document.createElement('div')
            card.className = "card"
            let secondCard = document.createElement('div')
            secondCard.classList.add('colFlex')
            secondCard.classList.add('leftCard')
            let thirdCard = document.createElement('div')
            thirdCard.classList.add('innerCard')
            thirdCard.classList.add('colFlex')
            let i = document.createElement('i')
            i.style = "color: white; font-size: 60px;"
            i.className = "far fa-user-circle";
            thirdCard.appendChild(i)
            let h3 = document.createElement('h3')
            h3.textContent = articles[counter].author
            h3.style = "margin-top: 8px;"
            thirdCard.appendChild(h3)
            let p = document.createElement('p')
            p.className = "date"
            p.textContent = articles[counter].date
            thirdCard.appendChild(p)
            secondCard.appendChild(thirdCard)
            card.appendChild(secondCard)
            console.log("here f")
            let rightCard = document.createElement('div')
            rightCard.classList.add("rightCard")
            rightCard.classList.add("colFlex")
            let h2 = document.createElement('h2')
            h2.className= "aquaText"
            h2.style = "text-align: center;"
            h2.textContent = articles[counter].title;
            rightCard.appendChild(h2)
            let p2 = document.createElement('p')
            p2.className = "caption"
            p2.textContent = articles[counter].caption
            rightCard.appendChild(p2);
            let rowFlex = document.createElement('div')
            rowFlex.className = "rowFlex";
            console.log("here5")
            if(articles[counter].keywords)
            {
                for(let inner = 0; inner < articles[counter].keywords.length; inner++)
                {
                    let temp = document.createElement('div')
                    temp.classList.add('keywords')
                    temp.classList.add('colFlex')
                    let tempP = document.createElement('p')
                    tempP.style = "margin: 0; padding: 0;"
                    tempP.textContent = articles[counter].keywords[inner]
                    temp.appendChild(tempP)
                    rowFlex.appendChild(temp)
                }
            }
            console.log("here")
            rightCard.appendChild(rowFlex)
            card.appendChild(rightCard)
            a.appendChild(card)
            document.querySelector('#articleHolder').appendChild(a)
        }
        console.log("shouldnt")
    }

    let newPost = async () =>
    {
        let title = $('#blogTitle')
        let caption = $('#blogCaption')
        let keywords = $('#blogKeywords')
        const keywordsArr = keywords.value.split(" ")
        const article = document.querySelector('#blogArticle')
        const date = new Date().toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric"})
        let response = await fetch('/write/newBlog', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({title: title.value, caption: caption.value, keywords: keywordsArr, article: article.value, date: date})
        })
        let json = await response.json()
        console.log(json);
        title.value =""
        keywords.value = ""
        article.value =""
        caption.value =""
    }

    const $ = (query) => document.querySelector(query)

    const getLikes = async (title) =>
    {
        console.log("here");
        let response = await fetch('/likes/' + title, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({title: title})
        })
        console.log(response);
        let {likes} = await response.json();
        let likeCount = $('#likeCount')
        let newText = document.createTextNode(likes);
        likeCount.appendChild(newText);
    }

    const getArticle = async (title) =>
    {
        let article = await fetch('/article');
    }

    const upLikes = async (title) =>
    {
        let iconDivs = document.querySelectorAll('.iconCircle');
        if(iconDivs[0].classList.contains("unliked"))
        {
            iconDivs[0].classList.toggle("unliked")
            iconDivs[0].classList.toggle("liked")
            iconDivs[0].querySelector('i').classList.toggle("likedI")
            let response = await fetch('/likes/' + title, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({title: title})
            })
            let {likes} = await response.json();
            let likeCount = $('#likeCount')
            let newText = document.createTextNode(likes);
            likeCount.textContent = "";
            likeCount.appendChild(newText);
        }
        else
        {
            iconDivs[0].classList.toggle("unliked")
            iconDivs[0].classList.toggle("liked")
            iconDivs[0].querySelector('i').classList.toggle("likedI")
            let response = await fetch('/downLikes/' + title, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({title: title})
            })
            let {likes} = await response.json();
            console.log(likes);
            let likeCount = $('#likeCount')
            let newText = document.createTextNode(likes);
            likeCount.textContent = "";
            likeCount.appendChild(newText);
        }
    }

    function loadComments()
    {
        let myDiv = document.querySelectorAll('.colorMe')
        let xBtn = document.querySelectorAll('.closeBtn')
        xBtn[0].classList.toggle("hide")
        myDiv[0].classList.toggle("open");
    }
    let posty = document.querySelector("#postComment")
    if(posty)
    {
    posty.addEventListener("click",
    async () =>
    {
        console.log("here")
        let response = await fetch('/newCommenter/' + title, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({title: title})
            })
        console.log("her3");
        const newby = await response.json();
        console.log(newby);
    })
}
    })