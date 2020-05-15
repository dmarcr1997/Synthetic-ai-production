let current_user;

class User{
    constructor(username, email, id){
        this.username = username;
        this.email = email;
        this.id = id;
        this.homePage();
    }
    index(){
        fetch(`${BASE_URL}/users/${this.id}`).then(response => response.json()).then(data => this.setUpHomePage(data)).catch(error => console.log(error.messages));
    }
    show(brain_id){
        fetch(`${BASE_URL}/users/${this.id}/brains/${brain_id}`).then(response => response.json()).then(data => this.setUpHomePage(data)).catch(error => console.log(error.messages));
    }      
    
    homePage(){
        mainContent.innerHTML ='';
        let heading = document.createElement('h1');
        heading.innerText = this.username;
        mainContent.appendChild(heading);
        this.createUserButtons();
        this.createBrainLinks();
    }
    createUserButtons(){
        let home = document.createElement('button');
        home.innerHTML = 'Home';
        home.addEventListener('click', () => this.homePage());
        mainContent.appendChild(home);
       
        let logout = document.createElement('button');
        logout.innerHTML = 'Logout';
        logout.addEventListener('click', () => {    
            console.log(getInfo(`${BASE_URL}/sessions/destroy`, 'logout'));
        });
        mainContent.appendChild(logout);
       
        let about = document.createElement('button');
        about.addEventListener('click', () => renderAboutPage());
        about.innerHTML = 'About';
        mainContent.appendChild(about);
        
    }

    createBrainButton(name){
        let button = document.createElement('button');
        button.innerHTML = `Create a ${name}`;
        let indexButton = document.createElement('button');
        indexButton.innerHTML = `All ${name}s`;
        button.addEventListener('click', () => Brain.renderBrainForm(name));
        indexButton.addEventListener('click', () => Brain.renderBrainIndex(`${BASE_URL}/users/${current_user.id}/brains`, {brain_type: name}));
        mainContent.appendChild(button);
        mainContent.appendChild(indexButton);
       
        
    }

    createBrainLinks(){
        let types = ['Suggestive Brain', 'Sentimental Brain']
        for(let i = 0; i < types.length; i++){
            this.createBrainButton(types[i]);
        }
    }
}

class Brain{
    static renderBrainForm(option){
        let thisUser = current_user;
        mainContent.innerHTML = '';
        let nameLabel = document.createElement('h1');
        nameLabel.innerText = 'Name';
        let inputOne = document.createElement('input');
        inputOne.placeholder = 'Name';
        let propertyLabel = document.createElement('h3');
        propertyLabel.innerText = 'Properties';
        let propertyPar;
        if (option === 'Suggestive Brain'){
            propertyPar = document.createElement('p');
            propertyPar.innerText = 'Suggestive brain value example {"input": {"Food":1}, "output": [0(for dislike)  or 1(for like)]}';
        }
        else if(option === 'Sentimental Brain'){
            propertyPar = document.createElement('p');
            propertyPar.innerText = 'Sentimental Brain value example {"input": "I am super happy!", "output": "happy"}';
        }        
        
        let inputTwo = document.createElement('textarea');
        inputTwo.placeholder = 'Properties';
        let submit = document.createElement('button');
        submit.innerText = 'Submit';
        submit.addEventListener('click', () => Brain.send(`${BASE_URL}/users/${thisUser.id}/brains/new`, {name: inputOne.value, brain_data: inputTwo.value, brain_type: option}));
        let attr = [nameLabel, inputOne, propertyLabel, inputTwo, propertyPar, submit];
        appendToMain(attr);
    }

    static send(url, values){
        fetch(`${url}`,{
            method: `POST`,
            headers: {
                'Content-Type': 'application/json',
                'Accepts': 'application/json'
            },
            body: JSON.stringify(values)
        }).then(response => response.json()).then((data) =>{
            Brain.renderBrainFromJson(data['data'])

        } ).catch((errors) => console.log(errors.messages));
    }
    static renderBrainFromJson(data){
        mainContent.innerHTML = '';
        let brainName = data['attributes']['name'];
        let brainType = data['attributes']['brain_type'];
        let currentData = data['attributes']['brain_data']
        
        let dataLabel = document.createElement('h3');
        dataLabel.innerText = 'DATA'; 
        let brainData = document.createElement('p');
        brainData.innerText = currentData;
        

        let homePageButton = document.createElement('button');
        homePageButton.innerText = 'Back to Landing Page'
        homePageButton.addEventListener('click', () => current_user.homePage()); 
        let attrs = [homePageButton, dataLabel, brainData];
        
        appendToMain(attrs);
        if (brainType === 'Sentimental Brain') Brain.setupSentimentalBrain(brainName, currentData, data);
        else if(brainType === 'Suggestive Brain') Brain.setupSuggestiveBrain(brainName, currentData, data);
        alert('Run learn to begin');
    }

    static updateBrain(data, value){
        let brain_id = data['id']
        Brain.send(`${BASE_URL}/users/${current_user.id}/brains/${brain_id}/edit`, {brain_data: value});
    }

    static renderBrainIndex(url, values){
        fetch(`${url}`,{
            method: `POST`,
            headers: {
                'Content-Type': 'application/json',
                'Accepts': 'application/json'
            },
            body: JSON.stringify(values)
        }).then(response => response.json()).then((data) =>{
            Brain.renderBrainsFromJson(data['data'], data)

        } ).catch((errors) => alert(errors.messages));
    }

    static renderBrainsFromJson(data, errors){
        let brains = data;
        
        if (errors['message']){
            alert(errors['message']);
        }
        else{
            mainContent.innerHTML = '';
            let h1 = document.createElement('h1');
            h1.innerText = `${brains[0]['attributes']['brain_type']}s`
            let ul = document.createElement('ul');
            for(let i = 0; i < brains.length; i++){
                let name = brains[i]['attributes']['name'];
                let li = document.createElement('li');
                li.innerText = name;
                li.addEventListener('click', () => Brain.renderBrainFromJson(brains[i]));
                let deleteButton = document.createElement('button');
                deleteButton.innerText = 'x';
                deleteButton.addEventListener('click', () => Brain.deleteBrain(brains[i]['id'], brains[0]['attributes']['brain_type']));
                ul.appendChild(li);
                ul.appendChild(deleteButton);
            }
            appendToMain([h1,ul]);
        }    
    }

    static setupSentimentalBrain(name, brainData, data){
        let sentBrain = new SentimentalBrain(name, brainData);
        let learnButton = document.createElement('button');
        learnButton.innerText = "LEARN";
        learnButton.addEventListener('click', () => sentBrain.learn());
        let sentenceInput = document.createElement('input');
        sentenceInput.placeholder = 'Enter Sentence Brain will tell you the mood it think it portrays';
        let sentSubmit = document.createElement('button');
        sentSubmit.innerText = "Submit";
        
        sentSubmit.addEventListener('click', () => sentBrain.sentenceMood(sentenceInput.value));
        let newSentHead = document.createElement('h3');
        newSentHead.innerText = "Add a New Sentence";
        let newSentenceInput = document.createElement('input');
        newSentenceInput.placeholder = 'Create a new sentence';
        let newSentenceMoodInput = document.createElement('input');
        newSentenceMoodInput.placeholder = 'Mood of this sentence';
        
        let learnAttrHead = document.createElement('h3');
        learnAttrHead.innerText = 'Change Learing iterations and error threshold for Brain';
        let iterHead = document.createElement('h4');
        iterHead.innerText = 'Iterations';
        let iterInput = document.createElement('input');
        iterInput.value = sentBrain.iterations;
        let errHead = document.createElement('h4');
        errHead.innerText = 'Error Threshold';
        let errorThreshInput = document.createElement('input');
        errorThreshInput.value = sentBrain.errorThresh;

        let learnAttrsubmit = document.createElement('button');
        learnAttrsubmit.innerText = "Update";
        learnAttrsubmit.addEventListener('click', () => {
            sentBrain.iterations = iterInput.value;
            sentBrain.errorThresh = errorThreshInput.value;
            console.log(sentBrain);
        });
        

        let newSentenceSubmit = document.createElement('button');
        newSentenceSubmit.innerText = "Create new Sentence";
        newSentenceSubmit.addEventListener('click', () => {
            Brain.updateBrain(data, `${brainData},\n{"input": "${newSentenceInput.value}", "output": "${newSentenceMoodInput.value}"}`);
            sentBrain.addSentence(newSentenceInput.value, newSentenceMoodInput.value);
        });
        let editVals = Brain.editFields(brainData, data);
        let attrs =[learnButton, sentenceInput, sentSubmit, newSentHead, newSentenceInput, newSentenceMoodInput,  newSentenceSubmit, learnAttrHead, iterHead, iterInput, errHead, errorThreshInput, learnAttrsubmit, ...editVals];
        appendToBrainPage(attrs);
    }

    static setupSuggestiveBrain(name, brainData, data){
        
        let sugBrain = new SuggestiveBrain(name, brainData);
        let learnButton = document.createElement('button');
        learnButton.innerText = "LEARN";
        learnButton.addEventListener('click', () => sugBrain.learn());
        let propertyInput = document.createElement('input');
        propertyInput.placeholder = 'Enter Property. Brain will tell you how much you like it.';
        let propSubmit = document.createElement('button');
        propSubmit.innerText = "Do I Like This?";
        
        propSubmit.addEventListener('click', () => sugBrain.propertyLike(propertyInput.value));
        let newPropertyPar = document.createElement('h3');
        newPropertyPar.innerText = 'Create a new Property and give it a like value. Less than 50 if you dislike it and greater if you like it'
        let newPropertyInput = document.createElement('input');
        newPropertyInput.placeholder = 'Create a new property';
        let newPropertyLike = document.createElement('p');
        newPropertyLike.innerText = '50';
        let propLikeButton = document.createElement('button');
        propLikeButton.innerText ='+';
        propLikeButton.addEventListener('click', () => {if (parseInt(newPropertyLike.innerText, 10) <= 100){ 
            newPropertyLike.innerHTML = `${parseInt(newPropertyLike.innerHTML, 10) + 1}`;
            
            }
        });
        let propDisLikeButton = document.createElement('button');
        propDisLikeButton.innerText ='-'; 
        propDisLikeButton.addEventListener('click', () => {if (parseInt(newPropertyLike.innerText, 10) >= 0) {
            
            newPropertyLike.innerHTML = `${parseInt(newPropertyLike.innerHTML, 10) -1}`;
            
            }
        });
        let likeNum;
        let newPropSubmit = document.createElement('button');
        newPropSubmit.innerText = "Create new Property";
        newPropSubmit.addEventListener('click', () => {
            if (parseInt(newPropertyLike.innerText, 10) >= 50) likeNum = 1;
            else if (parseInt(newPropertyLike.innerText,10) < 50) likeNum = 0;
        
            Brain.updateBrain(data, `${brainData},\n{"input": {"${newPropertyInput.value}": 1}, "output": [${likeNum}]}`);
            sugBrain.updateOrAddActivity(newPropertyInput.value, parseInt(newPropertyLike.innerText, 10), data)
        });
        let editVals = Brain.editFields(brainData, data);
        let attrs =[learnButton, propertyInput, propSubmit, newPropertyPar, newPropertyInput, newPropertyLike, propLikeButton, propDisLikeButton, newPropSubmit, ...editVals];
        appendToBrainPage(attrs);
    }
    static deleteBrain(id, brainType){
        fetch(`${BASE_URL}/users/${current_user.id}/brains/${id}/delete`, {
            method: 'POST'}).then(response => response.json()).then(data => {
            alert(data['message']);
        }).catch(error => console.log(error));
        mainContent.innerHTML = "";
        current_user.homePage();
    }

    static editFields(currentData, data){
        let dataEditHead = document.createElement('h3');
        dataEditHead.innerText = 'Edit Your Properties';
        let dataEditBox = document.createElement('textarea');
        dataEditBox.innerText = currentData;
        let dataEditSubmit = document.createElement('button');
        dataEditSubmit.innerText = 'Update Data';
        dataEditSubmit.addEventListener('click', () => Brain.updateBrain(data, dataEditBox.value));
        return [dataEditHead, dataEditBox, dataEditSubmit];
    }
}

class SuggestiveBrain{
    constructor(name, initData){
        this.name = name;
        this.data = [];
        this.data.push(initData)
        this.net = new brain.NeuralNetwork();
    }

    learn(){
        let learningData = [];
        let tmpData = this.data[0].split(",\n");
        
        for(let i = 0; i < tmpData.length; i++){
            try{
                let obj = JSON.parse(`${tmpData[i]}`);
                console.log(obj);
                learningData.push(obj);
            }
            catch(err){
                alert(`${err}. 
                You need to make sure your data looks like this 
                {"input": {"prop": 1}, "output":[0]},
                {"input": {"prop2": 1}, "output":[1]},
                {"input": {"prop3": 1}, "output":[0]}`);
            }
        }
        console.log(learningData);
        this.net.train(learningData);
        alert('Done Training');
        //add log to above code 
    }

    propertyLike(prop){
        let val = {}
        val[`${prop}`] = 1;
        console.log(val);
        let value = Array.from(this.net.run(val))[0];
        console.log(value);
        if(value > 0.9) return alert(`You Really Like ${prop}`);
        else if(value > 0.5) return alert(`You Kind of like ${prop}.`);
        else return alert(`You Hate ${prop}!`);
    }
    updateOrAddActivity(prop, likeVal = 50){
        let change;
        if (likeVal >= 50){
            change = '[1]';
        }
        else change = '[0]';
        this.data.push(`
        { "input": "${prop}", "output": [${change}]}`);
        this.learn();
        return alert(`You changed ${prop}'s value`);
    }
}

class SentimentalBrain{
    constructor(name, initData){
        this.name = name;
        this.data = [];
        this.data.push(initData);
        this.net = new brain.recurrent.LSTM();
        this._iterations = 1000;
        this._errorThresh = 0.011;
    }

    learn(){
        let learningData = [];
        let tmpData = this.data[0].split(",\n");
        console.log(tmpData);
        for(let i = 0; i < tmpData.length; i++){
            try{
                let obj = JSON.parse(`${tmpData[i]}`);
            
                learningData.push(obj);
            }
            catch(err){
                alert(`${err}.
                Add comma and new lines between entries(, hit enter)`);
            }
        }
        this.net.train(learningData, {
            iterations: this.iterations,
            errorThresh: this.errorThresh, 
            log: (error) => console.log(error)
        });
        alert('Done Training');
    }

    get iterations(){
        return this._iterations
    }
    set iterations(iter){
        this._iterations = iter;
    }
    get errorThresh(){
        return this._errorThresh;
    }
    set errorThresh(err){
        this._errorThresh = err;
    }
    addSentence(sentence, mood){
        this.data.push(`{"input": "${sentence}", "output": "${mood}"}`);
    }
    sentenceMood(sentence){
        try{
            console.log(sentence);
            alert(`This sentence feels ${this.net.run(sentence)}.`);
        }
        catch(err){
            alert(err);
        }
    }
}


const BASE_URL = "https://synthetic-ai-api2.herokuapp.com/"
const mainContent = document.getElementsByClassName('user_location')[0];

let renderHomePage = function(){
    mainContent.innerHTML = '';
    let box = document.createElement('h1')
    box.innerHTML = "Welcome to Synthetic Ai!!";
    mainContent.appendChild(box);
    let buttons = createHomeButtons();
    appendToMain(buttons);
}

let createHomeButtons = function(){
    let loginForm = document.createElement('input')
    let login = document.createElement('button');
    login.innerHTML = 'Login';
    login.addEventListener('click', () => sendInfo(`${BASE_URL}/sessions`, {username: loginForm.value}));

    let signUpForm = document.createElement('input')
    let signup = document.createElement('button');
    signup.innerHTML = 'Signup';
    signup.addEventListener('click', () => sendInfo(`${BASE_URL}/users/new`, {username: signUpForm.value}));

    let about = document.createElement('button');
    about.addEventListener('click', () => renderAboutPage());
    about.innerHTML = 'About';
    return [loginForm, login, signUpForm, signup, about];
}

let sendInfo = function(url, values){
    fetch(`${url}`,{
        method: `POST`,
        headers: {
            'Content-Type': 'application/json',
            'Accepts': 'application/json'
        },
        body: JSON.stringify(values)
    }).then(response => response.json()).then((data) =>{
        newUserFromJson(data)
    } ).catch((errors) => console.log(errors.messages));
}
let getInfo = function(url, option){
    fetch(`${url}`,{
        method: `GET`,
        headers: {
            'Content-Type': 'application/json',
            'Accepts': 'application/json'
        }
    }).then(response => response.json()).then((data) =>{
        renderHomePage();
        createMessageOrPage(data, option);
    } ).catch((errors) => console.log(errors.messages));
}
let createMessageOrPage = function(data, option){
    if (option === 'logout')
    {
        alert(data['message']);
    }
}
let newUserFromJson = function(data){
    if (data['message']){
        alert(data['message']);
    }
    else{
        mainContent.innerHTML = '';
 
        current_user = new User(data['data']['attributes']['username'], data['data']['attributes']['email'], data['data']['id']);
    }
}

 let setUp = function(data){
    console.log(data);
    if (data['noCurrentUser']) renderHomePage();
    else{
        newUserFromJson(data);
    }
 }

 let renderAboutPage = function(){
    console.log(current_user)
    mainContent.innerHTML = '';
    let box = document.createElement('div')
    box.innerHTML = "About";
    
    let loginPageButton = document.createElement('button');
    loginPageButton.innerText = 'Back to Landing Page'
    loginPageButton.addEventListener('click', () => {if (current_user !== undefined){
        homePage()}
        else refreshRender()}); 
    let par = document.createElement('p');
    par.innerText = "Hello Welcome to Synthetic Ai. The purpose of this application is to allow users to create, test, and implement basic Ai's. All of the Ai's used in this application were made using Brain.js.";
    let par2 = document.createElement('p');
    par2.innerText = "To get started create a brain following the instructions on each brain's form page. Then run learn once redirected and anytime you add a new attribute.";
    let par3 = document.createElement('p');
    par3.innerText = "I have left some of the errors for the user to fix since many just depend on how your data is input, but where ever I could I tried to put in messages to help fix any errors you might create.";
    let par4 = document.createElement('h1');
    par4.innerText = "Enjoy and Welcome";

    appendToMain([box, loginPageButton, par])
    appendToMain([par2]);
    appendToMain([par3, par4]);
}

let appendToMain = function(array){
    let cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    for(let i = 0; i < array.length; i++){
        cardDiv.appendChild(array[i]);
    }
    mainContent.appendChild(cardDiv);
}

let appendToBrainPage = function(array){
    
    let brainDiv = document.createElement('div');
    brainDiv.classList.add('brain');
    for(let i = 0; i < array.length; i++){
        
        brainDiv.appendChild(array[i]);

    }
    mainContent.appendChild(brainDiv);
}

let refreshRender = function(){
    fetch(`${BASE_URL}/sessions`,{
        method: 'GET'
    }).then(response => response.json()).then(data => setUp(data)).catch(error => alert(error.message));
    
}
 document.addEventListener('DOMContentLoaded', (e) => { 
    refreshRender();
});