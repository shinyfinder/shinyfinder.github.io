/**
 * On load event
 * Initializes the page by populating the bracket dropdown and setting light/dark mode
 */
// function that runs on page load
window.onload = function() {
    // add the event listener to the bracket importer
    document.getElementById('bracket-file-input').addEventListener('change', importBracket, false);

    // get the current light/dark mode, if it exists
    // if it doesn't set it,
    let curMode = localStorage.getItem('mode');
    if (curMode === null) {
        localStorage.setItem('mode', 'light');
    }
    // if it's set to light, remove the dark mode class
    else if (curMode == 'light') {
        document.body.classList.remove('dark-mode');
    } 
    // if it's set to dark, add the dark mode class and update localstorage
    else if (curMode == 'dark') {
        localStorage.setItem('mode', 'dark');
    }

    // retrieve the brackets from storage
    const brackets = localStorage;

    // if there are some, populate the select dropdown
    if (brackets.length) {
        let bracketNames = Object.keys(brackets);
        // remove the dark mode entry from displaying in the dropdown
        const modeIndex = bracketNames.indexOf('mode');
        bracketNames.splice(modeIndex,1);
        // populate the dropdown
        const sel = document.getElementById('bracketSelect');
        bracketNames.forEach((name,key) => {
            sel[key+1] = new Option(name, key+1);
        })
    }

    // save this inital state to the sessionStorage for reset
    const initialDOM = document.getElementById('pageContent').innerHTML;
    sessionStorage.setItem('initialDOM', JSON.stringify(initialDOM));
}




/**
 * 
 * Bracket Management Functions
 *  Set of functions to load, delete, and make new brackets
 */


/**
 * Retrieves bracket information from localStorage and initializes the DOM
 * @returns void
 */
function loadBracket() {
    // get the selected bracket
    const bracketSelect = document.getElementById('bracketSelect');

    // return if the default entry is selected
    if (bracketSelect.selectedIndex == 0) {
        return;
    }

    // get the name of the selected bracket
    const text = bracketSelect.options[bracketSelect.selectedIndex].innerHTML;

    // load the bracket information
    const bracket = JSON.parse(localStorage.getItem(text));

    // if the bracket wasn't made on this page, return
    if (bracket.origin != 'manage') {
        alert('Bracket not made in this mode. Please load on the other page.');
        // reset the selected index to 0
        bracketSelect.selectedIndex = 0;
        return;
    }
    // update the current bracket in session storage
    sessionStorage.setItem('currentBracket', text);

    // populate the DOM
    const pageInfo = document.getElementById('pageContent');
    pageInfo.innerHTML = bracket.DOM;
    pageInfo.style.display = 'block';
    document.getElementById('curBrackName').innerHTML = text;

    // if there are checkboxes in the extensions and brackets divs, re-add the on click functions
    const extCheckBoxes = document.querySelectorAll('#extensions input[type=checkbox]');
    if (extCheckBoxes.length) {
        extCheckBoxes.forEach( e => {
            e.addEventListener('change', function () {extWinnerChosen(this); storeChecked(this);} );
        })
    }
    const bracketCheckBoxes = document.querySelectorAll('#chooseWinners input[type=checkbox]');
    if (bracketCheckBoxes.length) {
        bracketCheckBoxes.forEach( e => {
            e.addEventListener('change', function () {storeChecked(this);} );
        })
    }

    // if the last button is for the final round, re-add the on click event
    const finalBtn = document.getElementById('advance');
    if (finalBtn.innerHTML == 'Calc Final Scores') {
        finalBtn.addEventListener('click', function () {calcFinalScore()})
    }

    // reset the selected index to 0
    bracketSelect.selectedIndex = 0;

    // put the usernames back
    if (bracket.participants) {
        document.getElementById('inputBox').value = bracket.participants.join('\n');
    }
    
    // re-check the boxes
    const checkedBoxes = document.querySelectorAll('.checked');

    for (i = 0; i < checkedBoxes.length; i++) {
        checkedBoxes[i].checked = true;
    }

    // put back the number of rounds remaining
    document.getElementById('rounds').innerHTML = bracket.roundsRemaining;

    // repopulate the session storage with the pair info
    sessionStorage.setItem('pairs', JSON.stringify(bracket.pairs ?? []));

}

/**
 * Deletes the selected bracket in the dropdown
 * Deletions require confirmation in a popup
 * @returns void
 */
function deleteBracket() {
    // get the selected bracket
    const bracketSelect = document.getElementById('bracketSelect');

    // return if the default entry is selected
    if (bracketSelect.selectedIndex == 0) {
        return;
    }

    // get the name of the selected bracket
    const text = bracketSelect.options[bracketSelect.selectedIndex].innerHTML;

    
    // confirm
    let confirmText = `You are about to delete bracket ${text}. This action cannot be undone!\nContinue?`;
    if (confirm(confirmText) == true) {
        // delete the bracket from the local storage
        localStorage.removeItem(text);

        // set the select to the default value
        bracketSelect.selectedIndex = 0;
    }

}


/**
 * Creates a new bracket instance in the session storage
 * @returns void
 */
function newBracket() {
    // get the input in the text field for the bracket name
    const nameInput = document.getElementById('bracketName');
    const name = nameInput.value;
    // reset the input
    nameInput.value = '';
    
    // return if name is blank
    if (name == '') {
        alert('You must enter a name for the bracket');
        return;
    }

    // check to make sure the name doesn't already exist
    let allBracketNames = Object.keys(localStorage);
    if (allBracketNames.includes(name)) {
        alert('A bracket of this name already exists! Please choose a different name.');
        return;
    }

    // get and validate the input for the number of rounds
    const numRounds = parseInt(document.getElementById('numRounds').value);

    if (isNaN(numRounds)) {
        alert('Invalid number of rounds entered. Please enter an integer at least 1.');
        return;
    }

    
    // reset the dom to its initial state
    const initialDOM = JSON.parse(sessionStorage.getItem('initialDOM'));
    document.getElementById('pageContent').innerHTML = initialDOM;

    // save the name and rounds remaining to local storage
    let bracket = {};
    bracket['DOM'] = initialDOM;
    bracket['roundsRemaining'] = numRounds;
    bracket['origin'] = 'manage';
    localStorage.setItem(name, JSON.stringify(bracket));

    // use the sessionStorage to save the name of the current bracket being used
    sessionStorage.setItem('currentBracket', name);
    sessionStorage.removeItem('pairs');

    // display the rest of the DOM so the user can input the players
    document.getElementById('pageContent').style.display = 'block';
    document.getElementById('curBrackName').innerHTML = name;
    document.getElementById('rounds').innerHTML = numRounds;

    // because we don't reload the page, we have to manually update the dropdown
    allBracketNames = Object.keys(localStorage);
    // remove the dark mode entry from displaying in the dropdown
    const modeIndex = allBracketNames.indexOf('mode');
    allBracketNames.splice(modeIndex,1);

    // populate the dropdown
    const sel = document.getElementById('bracketSelect');
    allBracketNames.forEach((name,key) => {
        sel[key+1] = new Option(name, key+1);
    });
}

/**
 * Exports the selected bracket to a txt file
 */
function exportBracket() {
    // get the selected bracket
    const bracketSelect = document.getElementById('bracketSelect');

    // return if the default entry is selected
    if (bracketSelect.selectedIndex == 0) {
        return;
    }

    // get the name of the selected bracket
    const text = bracketSelect.options[bracketSelect.selectedIndex].innerHTML;

    // load the bracket information
    const bracket = localStorage.getItem(text);

    // construct a blob to save
    const blob = new Blob([bracket], { type: 'application/json' });

    // create a link that gets clicked to download the file
    const a = document.createElement('a');
    const filename = text.replace(/[/\\?%*:|"<>]/g, '-');
    a.download = `${filename}-export.txt`;
    a.href = URL.createObjectURL(blob);
    a.addEventListener('click', (e) => {
        setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
    });
    a.click();
}

/**
 * Imports the bracket file chosen
 * Overwrites anything of the same name
 */
function importBracket(e) {
    // get the selected file
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    // get the file name -- this is the name for the new bracket
    const filename = file.name;
    const bracketName = filename.substr(0, filename.lastIndexOf("."));
    if (!bracketName) {
        alert('Invalid file imported.');
        return;
    }

    // create a new file reader
    const reader = new FileReader();

    // once the file is loaded, process it
    reader.onload = function(e) {
        // get the contents of the file
        const contents = e.target.result;

        // save it to the localstorage
        localStorage.setItem(bracketName, contents);

        // reload the page
        location.reload();
    };

    // load the file
    reader.readAsText(file);
}



/**
 * Helper functions
 */

/**
 * Deletes the forms from the DOM so they don't build up
 * @returns void
 */
function resetWinners() {
    document.getElementById('chooseWinners').innerHTML = '';
    document.getElementById('extensions').innerHTML = '';
    document.getElementById('output-ext').innerHTML = '';
    document.getElementById('output-bracket').innerHTML = '';
    
    return;
}

/**
 * Toggles the "checked" class to a passed element and saves it to localStorage
 * The checked class is used to re-check the boxes on page load
 * @param {*} e HTML element (checkbox) to which the checked class is added/removed
 * @returns void
 */
function storeChecked(e) {
    // add/remove the checked class
    e.classList.toggle('checked');

    // retrieve the current bracket from storage
    const curBracket = sessionStorage.getItem('currentBracket');
    let bracket = JSON.parse(localStorage.getItem(curBracket));
    // update the DOM to store the new class information
    const curDOM = document.getElementById('pageContent').innerHTML;
    bracket['DOM'] = curDOM;
    localStorage.setItem(curBracket,JSON.stringify(bracket));
    
}


/**
 * Shuffles an array using the fisher-yates shuffle algorithm
 * @param {string[]} array array of usernames to randomize
 * @returns shuffled array provided in input
 * @see https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array#2450976
 */
function shuffle(array) {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

/**
 * Checks for duplicate entries in an array
 * @param {string[]} array array of names
 * @returns {boolean} true/false
 */
function hasDuplicates(array) {
    // creating a new set removes any duplicate entries
    // compare the length of the new set to the length of the input
    // if the lengths are different, there are duplicate entries. Return true.
    return (new Set(array)).size !== array.length;
}

/**
 * Gets the repeated entry in an array
 * @param {string[]} array 
 * @returns {string[]} array of repeated entries
 */
// function to find duplicate entries in an array
function findDuplicates(array) {
    // make a copy and sort the array of usernames
    let sortedArr = array.slice().sort();
    let results = [];
    // loop through the sorted array
    // if adjacent entries are the same, log this value to the results array
    for (let i = 0; i < sortedArr.length - 1; i++) {
        if (sortedArr[i+1] == sortedArr[i]) {
            results.push(sortedArr[i]);
        }
    }
    return results;
}

/**
 * Onclick event handler for the winner form checkboxes
 * When someone clicks the box, it updates the Winner of/Loser of text within the DOM
 * @param {*} e checkbox
 * @returns void
 */
function extWinnerChosen(e) {
    // get the nearby information so that the winner/loser text can be updated
    const matchup = e.nextSibling === null ? e.previousSibling.innerHTML : e.nextSibling.innerHTML; // a VS b text
    const name = e.value; // name of the person who's box was clicked
    const opp = e.nextElementSibling === null ? e.previousElementSibling.previousElementSibling.value : e.nextElementSibling.nextElementSibling.value; // name of opponent
    const oppElem = e.nextElementSibling === null ? e.previousElementSibling.previousElementSibling : e.nextElementSibling.nextElementSibling; // opponent element
    const curBracket = sessionStorage.getItem('currentBracket'); // name of the current bracket
    let bracket = JSON.parse(localStorage.getItem(curBracket)); // all of the bracket information
    const oldPairsOrig = bracket['pairs'];
    let oldPairs = JSON.parse(sessionStorage.getItem('pairs')) || JSON.parse(JSON.stringify(bracket['pairs'])); // old pairings so we can update the text


    // checked box, opp box unchecked
    if (e.checked && !oppElem.checked) {
        // search through the chooseWinners brackets to replace the text with the name of the winner
        const brackets = [...document.getElementById('chooseWinners').children]; // gets the forms
        // loop through the brackets
        for (let i = 0; i < brackets.length; i++) {
            if (brackets[i].tagName != 'FORM') {
                continue;
            }
            const players = [...brackets[i]];
            // loop through the players within that bracket
            for (let j = 0; j < players.length; j++) {
                // winner of text
                if (players[j].defaultValue === `(Winner of ${matchup})`) {
                    players[j].value = name;
                    // kinda hacky, but we know that there's only 2 players
                    if (j % 2 == 0) {
                        // toggle the text
                        players[j].nextSibling.innerHTML = players[j].nextSibling.innerHTML.replace(`(Winner of ${matchup})`, name);
                    }
                    else {
                        players[j].previousSibling.innerHTML = players[j].previousSibling.innerHTML.replace(`(Winner of ${matchup})`, name);
                    }                    
                }
                // loser of text
                else if (players[j].defaultValue === `(Loser of ${matchup})`) {
                    players[j].value = opp;
                    if (j % 2 == 0) {
                        players[j].nextSibling.innerHTML = players[j].nextSibling.innerHTML.replace(`(Loser of ${matchup})`, opp);
                    }
                    else {
                        players[j].previousSibling.innerHTML = players[j].previousSibling.innerHTML.replace(`(Loser of ${matchup})`, opp);
                    }
                    
                }
            }
        }
        // update the old pairs saved in storage
        for (let i = 0; i < oldPairs.length; i++) {
            for (let j = 0; j < oldPairs[i].length; j++) {
                if (oldPairs[i][j] ===  `(Winner of ${matchup})`) {
                    oldPairs[i][j] = name;
                    sessionStorage.setItem('pairs', JSON.stringify(oldPairs));
                }
                else if (oldPairs[i][j] === `(Loser of ${matchup})`) {
                    oldPairs[i][j] = opp;
                    sessionStorage.setItem('pairs', JSON.stringify(oldPairs));
                }
            }
        }



    }

    // uncheck box, opp box checked
    else if (!e.checked && oppElem.checked) {
        // search through the chooseWinners brackets to replace the text with the name of the winner
        const brackets = [...document.getElementById('chooseWinners').children]; // gets the forms
        // loop through the brackets
        for (let i = 0; i < brackets.length; i++) {
            if (brackets[i].tagName != 'FORM') {
                continue;
            }
            const players = [...brackets[i]];
            // loop through the players within that bracket
            for (let j = 0; j < players.length; j++) {
                if (players[j].defaultValue === `(Winner of ${matchup})`) {
                    players[j].value = opp;
                    if (j % 2 == 0) {
                        players[j].nextSibling.innerHTML = players[j].nextSibling.innerHTML.replace(`(Winner of ${matchup})`, opp);
                    }
                    else {
                        players[j].previousSibling.innerHTML = players[j].previousSibling.innerHTML.replace(`(Winner of ${matchup})`, opp);
                    }
                    
                }
                else if (players[j].defaultValue === `(Loser of ${matchup})`) {
                    players[j].value = name;
                    if (j  % 2 == 0) {
                        players[j].nextSibling.innerHTML = players[j].nextSibling.innerHTML.replace(`(Loser of ${matchup})`, name);
                    } else {
                        players[j].previousSibling.innerHTML = players[j].previousSibling.innerHTML.replace(`(Loser of ${matchup})`, name);
                    }
                    
                }
            }
        }
        // update the old pairs
        for (let i = 0; i < oldPairs.length; i++) {
            for (let j = 0; j < oldPairs[i].length; j++) {
                if (oldPairs[i][j] ===  `(Winner of ${matchup})`) {
                    oldPairs[i][j] = opp;
                    sessionStorage.setItem('pairs', JSON.stringify(oldPairs));
                }
                else if (oldPairs[i][j] === `(Loser of ${matchup})`) {
                    oldPairs[i][j] = name;
                    sessionStorage.setItem('pairs', JSON.stringify(oldPairs));
                }
            }
        }

    }

    // uncheck box, opp box unchecked
    // checked box, opp box checked
    else {
        // search through the chooseWinners brackets to replace the text with the name of the winner
        const brackets = [...document.getElementById('chooseWinners').children]; // gets the forms
        // loop through the brackets
        for (let i = 0; i < brackets.length; i++) {
            if (brackets[i].tagName != 'FORM') {
                continue;
            }
            const players = [...brackets[i]];
            // loop through the games within that bracket
            for (let j = 0; j < players.length; j++) {
                if (players[j].dataset.default === `(Winner of ${matchup})`) {
                    players[j].value = players[j].dataset.default;
                    if (j % 2 == 0) {
                        players[j].nextSibling.innerHTML = players[j].nextSibling.dataset.default;
                    }
                    else {
                        players[j].previousSibling.innerHTML = players[j].previousSibling.dataset.default;
                    }
                    
                }
                else if (players[j].dataset.default === `(Loser of ${matchup})`) {
                    players[j].value = players[j].dataset.default;
                    if (j % 2 == 0) {
                        players[j].nextSibling.innerHTML = players[j].nextSibling.dataset.default;
                    }
                    else {
                        players[j].previousSibling.innerHTML = players[j].previousSibling.dataset.default;
                    }
                    
                }
            }
        }

        // update the old pairs
        for (let i = 0; i < oldPairsOrig.length; i++) {
            for (let j = 0; j < oldPairsOrig[i].length; j++) {
                if (oldPairsOrig[i][j] ===  `(Winner of ${matchup})`) {
                    oldPairs[i][j] = `(Winner of ${matchup})`;
                    sessionStorage.setItem('pairs', JSON.stringify(oldPairs));
                }
                else if (oldPairsOrig[i][j] === `(Loser of ${matchup})`) {
                    oldPairs[i][j] = `(Loser of ${matchup})`;
                    sessionStorage.setItem('pairs', JSON.stringify(oldPairs));
                }
            }
        }
    }
    return;
}

/**
 * Sets the text and function of the advance button to indicate it's the final round
 */
function finalRound() {
    // get the button
    const finalBtn = document.getElementById('advance');
    // update the onclick function
    finalBtn.setAttribute('onclick', calcFinalScore);
    finalBtn.onclick = function() {calcFinalScore();};
    // change the button text
    finalBtn.innerHTML = 'Calc Final Scores';
}

/**
 * Finds the index of the Winner of/Loser of/bye text
 * @param {*} arr array of paired usernames
 * @returns index in array with the special text
 */
function findWLIndices(arr) {
    let indices = [];
    // find and log the special text in the provided array
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].includes('(Winner of') || arr[i].includes('(Loser of') || arr[i] === 'BYE') {
            indices.push(i);
        }
    }
    
    return indices;
}

/**
 * Parses the provided input of usernames using the bracket maker syntax of A vs B
 * Extracts a list of names of all of the users
 * @returns string array
 */
function parseBM() {
    // get the input
    const providedNames = document.getElementById('inputBox').value.split(/[\r\n]+/);

    // loop over the input to match the regex of the names
    const participants = [];

    for (let i = 0; i < providedNames.length; i++) {
        const parsedMatchup = providedNames[i].match(/@(\S+.+) \u202Fvs\u202F @(\S+.+)/, 'g')
        if (parsedMatchup === null) {
            alert('Unable to parse output from Bracket Maker.');
            break;
        }
        // log the names
        participants.push(parsedMatchup[1]);
        participants.push(parsedMatchup[2]);
    }
    
    return participants;
}

/**
 * Posts the matchup results to the DOM for the previous round
 * @param {*} arr array of matchups to be posted
 * @param {*} id id of the div to which the array is posted
 */
function postResults(arr, id) {
    const arrOut = [];
    // extract the nodes from the object
    if (id == 'results') {
        let bracketStrOut = '';
        let bracketStrOutOld = '';
        for (let i = 0; i < arr.length; i++) {
            // get the parent div
            const parentDiv = document.getElementById(arr[i]);

            // get the record for this bracket
            // lag the text by 1 loop so we can see if it changed
            // we only want to make a new header if the ratio changed
            bracketStrOutOld = bracketStrOut;
            bracketStrOut = parentDiv.dataset.bracket;

            if (bracketStrOut != bracketStrOutOld) {
                arrOut.push('<br />' + bracketStrOut + '<br />');
            }
            
            // get the names of the players from the obj
            const matchup = parentDiv.children;
    
            // get the player checkboxes from this matchup
            const pElem1 = matchup[0];
            const pElem2 = matchup[2];
            
            // build the output based on who won
            if (pElem1.checked && pElem2.value != 'BYE') {
                strOut = `[b]@${pElem1.value}[/b] VS @${pElem2.value}`;
                arrOut.push(strOut);
            }
            else if (pElem1.checked && pElem2.value == 'BYE') {
                strOut = `[b]@${pElem1.value}[/b] VS ${pElem2.value}`;
                arrOut.push(strOut);
            }
            else {
                strOut = `@${pElem1.value} VS [b]@${pElem2.value}[/b]`;
                arrOut.push(strOut);
            }

        }
        
    }
    // if it's an ext, we don't want the header
    else {
        arr.forEach( matchup => {
            strOut = `@${matchup[0]} VS @${matchup[1]}`;
            arrOut.push(strOut);
        });

    }
    // post to dom    
    document.getElementById(id).innerHTML = arrOut.join('<br />');

}

/**
 * Posts the current Win/Loss ratios to the DOM after each round
 * @param {object} obj 
 * @param {*} ext 
 */
function postStandings(obj, ext) {
    // get the entries in the standings object for sorting
    let finalResults = Object.entries(obj);

    // get the names of all of the people for extensions as an array
    const allExtNames = [];

    for (let i = 0; i < ext.length; i++) {
        // log the names
        allExtNames.push(...ext[i]);
    }
    // sort them so most inws is first
    finalResults = finalResults.sort(function (a,b) {
        // a and b are adjacent elements in the array
        // the array is sorted based on whether the differential is higher or lower
        // the differential is calculated based on Wins - Losses
        // this sorts the array with highest differential first
        return (b[1][0] - b[1][1]) - (a[1][0] - a[1][1]);
    });

    // build an array of strings for output
    const arrOut = [];

    for (let i = 0; i < finalResults.length; i++) {
        // don't output the W/L of the BYE
        if (finalResults[i][0] == 'BYE') {
            continue;
        }
        // build the output string based on whether they currently have an extension
        if (allExtNames.includes(finalResults[i][0])) {
            const strOut = `@${finalResults[i][0]}: ${finalResults[i][1]} (Pending)`;
            arrOut.push(strOut);
        } else {
            const strOut = `@${finalResults[i][0]}: ${finalResults[i][1]}`;
            arrOut.push(strOut);
        }
    }

    document.getElementById('standings').innerHTML = arrOut.join('<br />');
}

/**
 * Removes a user from the bracket
 * @returns void
 */
// 
function removeUser() {
    // get the entered name
    const userField = document.getElementById('removeUserField');
    const user = userField.value;

    // check for no name provided
    if (user == '') {
        alert('You must enter a username.');
        return;
    }

    // get the name of the current bracket from the session storage
    const curBracket = sessionStorage.getItem('currentBracket') || '';

    // check for no loaded bracket
    if (curBracket == '') {
        alert('You must load or make a bracket first!');
        return;
    }

    // retreive the same item from local storage to save the data across sessions
    let bracket = JSON.parse(localStorage.getItem(curBracket)) || '';

    if (bracket == '') {
        alert('Desired bracket not found.');
        return;
    }

    // remove the user from the list of participants
    let participants = bracket.participants || [];
    if (participants.includes(user)) {
        const index = participants.indexOf(user);
        bracket.participants.splice(index, 1);
        alert('User removed');
        userField.value = '';
    } else {
        alert('User not found in this bracket!');
        userField.value = '';
        return;
    }

    // initialize the quit list
    // this list stores the names of the people who quit
    const quitList = bracket['quits'] || [];
    let quitStandings = bracket['quitStandings'] || {};
    // append this user to the list
    quitList.push(user);


    
    if (bracket.standings) {
        // store the w/l ratio of the quitter to a separate object
        // and delete their name from the main bracket
        quitStandings[user] = bracket.standings[user];
        delete bracket.standings[user];
    }
    // update the DOM
    bracket['quits'] = quitList;
    bracket['quitStandings'] = quitStandings;
    localStorage.setItem(curBracket, JSON.stringify(bracket));
}

/**
 * Substitutes all instances of a username with a new username
 * @returns void
 */
function subUser() {
    // get the entered names
    const userField1 = document.getElementById('subUserField1');
    const userField2 = document.getElementById('subUserField2');
    const user1 = userField1.value;
    const user2 = userField2.value;

    // check for blank
    if (user1 == '' || user2 == '') {
        alert('You must enter a username.');
        return;
    }
    // check for same name
    if (user1 == user2) {
        return;
    }
    // get the name of the current bracket from the session storage
    const curBracket = sessionStorage.getItem('currentBracket') || '';

    // check for no active bracket
    if (curBracket == '') {
        alert('You must load or make a bracket first!');
        return;
    }

    // retreive the same item from local storage to save the data across sessions
    let bracket = JSON.parse(localStorage.getItem(curBracket)) || '';

    if (bracket == '') {
        alert('Desired bracket not found.');
        return;
    }

    // update the participants
    let participants = bracket.participants || [];
    if (participants.includes(user1)) {
        const index = participants.indexOf(user1);
        bracket.participants.splice(index, 1, user2);
    } else {
        alert('User not found in this bracket!');
        UserField1.value = '';
        return;
    }

    // update the standings
    let standings = bracket.standings || [];

    if (user1 !== user2) {
        Object.defineProperty(standings, user2,
            Object.getOwnPropertyDescriptor(standings, user1));
        delete standings[user1];
    }

    // update the pairs
    if (bracket.pairs) {
        for (let i = 0; i < bracket.pairs.length; i++) {
            for (let j = 0; j < bracket.pairs[i].length; j++) {
                if (bracket.pairs[i][j] == user1) {
                    bracket.pairs[i][j] = user2;
                }
            }
        }
    }

    // update the DOM
    if (bracket.DOM) {
        bracket.DOM = bracket.DOM.replaceAll(user1, user2);
    }

    // reset the input fields
    userField1.value = '';
    userField2.value = '';
    alert('User subbed! Please reload the bracket to take effect');


    // repost to DOM
    localStorage.setItem(curBracket, JSON.stringify(bracket));
}





 /**
  * Tournament management functions
  * Main group of functions that build each round of the tournament
  */

 /**
  * Retrieves the entered usernames and verifies the input.
  * Runs whenever you click the make bracket button.
  * We separate this out because we need to reset the page for the inital bracket
  * but not whenever we make a bracket, as that would overwrite the new groups after R1
  * @calls makeBracket() 
  */
function initBracket() {
    let providedNames;

    // reinitialize the DOM
    resetWinners();

    // check whether the box to use bracket maker format is checked
    const BMFlag = document.getElementById('parseBracketMakerOption').checked;
    
    // if it's set to parse the bracket maker output, use the respective parse function
    if (BMFlag) {
        providedNames = parseBM();
    } else {
        providedNames = document.getElementById('inputBox').value.split(/[\r\n]+/);
    }
    
    // check for no input
    if (providedNames == '') {
        alert(`Please enter the names of the participants.`);
        return;
    }

    // check for < 4 users
    if (providedNames.length < 4) {
        alert(`Tournaments require at least 4 participants! You currently have ${providedNames.length}.`);
        return;
    }

    // remove any empty strings
    providedNames = providedNames.filter(user => user);

    // check to make sure there are no repeats
    const dupFound = hasDuplicates(providedNames);
    // if a duplicate is found, let the user know and return which entry is duplicated
    if (dupFound) {
        const dupes = findDuplicates(providedNames);
        alert(`Duplicate entries found: ${dupes}`);
        return;
    }

    // get the name of the current bracket from the session storage
    const curBracket = sessionStorage.getItem('currentBracket');

    // retreive the same item from local storage to save the data across sessions
    let bracket = JSON.parse(localStorage.getItem(curBracket));

    
    // make sure they didn't enter too many rounds
    const theoreticalRounds = Math.floor(providedNames.length / 2);

    if (theoreticalRounds < bracket.roundsRemaining) {
        alert(`Warning: Desired number of rounds is greater than the theoretical max for this number of participants: ${theoreticalRounds}. Please make a new bracket with no more than ${theoreticalRounds} round(s).`);
        return;
    }

    // decrement the rounds remaining and update the DOM
    bracket.roundsRemaining = bracket.roundsRemaining - 1;
    document.getElementById('rounds').innerHTML = bracket.roundsRemaining;
    
    // save the entered userlist
    bracket['participants'] = providedNames;

    // if they only entered 1 round, call the function for the final round
    if (bracket.roundsRemaining == 0) {
        finalRound();
    }

    // save to storage
    localStorage.setItem(curBracket, JSON.stringify(bracket));

    makeBracket();
}


/**
 * Takes the passed usernames and pairs them together
 * @param {*} group list of usernames to pair together, grouped together by their w/l ratios
 * @param {*} ext pre-determined pairs for an extension
 * @param {*} makeExtBracket flag to say whether the passed names are for the regular or extension brackets
 * @calls createWinnerForm()
 */
function makeBracket(group, ext, makeExtBracket) {
    // hide this button so people can't push it again and break everything
    document.getElementById('makeBracketBtn').style.display = 'none';
    // make the advance button visible
    document.getElementById('advance').style.display = 'block';

    // get the current bracket and intiliaze variables
    const curBracket = sessionStorage.getItem('currentBracket');

    let bracket = JSON.parse(localStorage.getItem(curBracket));
    const providedNames = bracket['participants'];
    const oldPairings = bracket['pairs'] || [];

    let userlist;
    // if you are making an extension bracket, the names are already paired, so we don't need to pair them again
    if (makeExtBracket) {
        userlist = ext;
    }
    // if you're making an extension bracket, use the names passed into groups
    else if (group && !makeExtBracket) {
        //userlistIn = providedNames.split(/[\r?\n]+/) == '' ? group : providedNames.split(/[\r?\n]+/);
        userlist = group;
    }
    // the first call to this function doesn't pass anything, so get the list of names from storage.
    else {
        //userlist = providedNames.split(/[\r?\n]+/);
        userlist = JSON.parse(JSON.stringify(providedNames));
    }
    

    // shuffle the input array
    // unless there's only 2 names
    // we've already checked for entries less than 2
    // if the list is equal to 2, flip the order
    // this is because the pop() method below will flip it back
    if (userlist.length !== 2) {
        userlist = shuffle(userlist);
    }
    else {
        userlist = [userlist[1], userlist[0]];
    }

    
    // make a deep copy of the userlist
    let userlistCopy = JSON.parse(JSON.stringify(userlist));

    // create array to hold the pairings
    let pairings = [];
    let name1 = '', name2 = ''

    // flag to make sure the pairings have never happened before
    // if they have, reshuffle and remake the parings array
    let validPairs = false;

    // set the max number of retries
    let retries = 500;
    
    // if a pair appears that has happened before, retry
    while (!validPairs) {
        pairings = [];
        const origUserlistLen = userlist.length;
        // pair off each name in the shuffled array
        while (userlistCopy.length) {
            // get the last element in the array
            // removes this element from the original array
            name1 = userlistCopy.pop();      
    
            // get the next last element as the opponent
            // if there are no more names left, set the opponent to a bye
            if (userlistCopy.length == 0) {
                name2 = 'BYE';
            } else {
                name2 = userlistCopy.pop();
            }
            
            // group them together
            const tempPair = [name1, name2];

            // check whether this pairing has occurred before
            // only perform the check for a regular bracket
            let isOldPair = false;
            if (!makeExtBracket) {
                // check whether this pair occurs in the saved pairs from the previous rounds
                isOldPair = oldPairings.some(arr => {
                    const sameTest = arr.every(function(element) {
                        // test whether the pair is the same
                        // [A, B] is the same as [B, A]
                        // ignore BYE vs BYE matchups
                        return element === tempPair[0] || element === tempPair[1] && tempPair[0] !== tempPair[1]; 
                    });
                    return arr.length == tempPair.length && sameTest;
                })
            }


            // if there are only 2 names and they've met before, there's nothing we can do
            if (isOldPair && origUserlistLen == 2) {
                alert('No possible pairings left!');
                return;
            }
            
            // if it's an old pair, break the loop
            if (isOldPair) {
                break;
            }
            // if it's a new pair, push it to the pairings array
            pairings.push([name1, name2]); 
            
            // check on last loop if everything is ok
            // if you got this far and there are no more names, then this is a valid bracket
            if (!userlistCopy.length) {
                validPairs = true;
            }
        }
        // if the pairs aren't valid, reshuffle and try again
        if (!validPairs) {
            userlistCopy = shuffle(userlist);
        }
        // decrement the number of retries remaining and stop when you've reached the max
        retries--
        if (retries < 0) {
            alert('Max number of tries exceeded. Unable to create pairings that do not duplicate.');
            // output the stored W/L ratios and previous pairs to the DOM so the user can take over
            const standings = bracket.standings;
            postStandings(standings, []);
            const pairs = ['Old pairs', '',...bracket.pairs];
            document.getElementById('results').innerHTML = pairs.join('<br />');
            return;
        }
    }

    // create array to hold the pairings with taggable output
    // becomes an array of pair arrays
    const pairTextArr = [];

    // loop thru the pair array and combine each pairing with: @NAME1 VS @NAME2
    // check if the pairings includes the Winner of/Loser of text
    // if it does, we need to modify the output string slightly so the @ goes in the right place
    // .some returns true or false depending on whether it passes the provided function
    // .find returns the first element in the provided array that satisfies the testing criteria
    // .includes tests the substring for the desired string
    

    // make a deep copy of the pairings array
    let pairingsCopy = JSON.parse(JSON.stringify(pairings));
    
    // loop over the array
    for (let i = 0; i < pairingsCopy.length; i++) {
        // check for special cases (Winner of, Loser of, bye)
        const winLossIndex = findWLIndices(pairingsCopy[i]);

        // if a special case occurs, this occurs to a extension
        // loop over the array of arrays
        // when you get to the same name as the one in the list of extensions, add the @ symbol
        if (winLossIndex.length && !makeExtBracket && ext) {
            for (let j = 0; j < pairingsCopy[i].length; j++) {
                // loop over each entry in the ext array
                for (let k = 0; k < ext.length; k++) {
                    // when you find a name that matches a name in the extension array, add an @
                    if (pairingsCopy[i][j].includes(ext[k])) {
                        pairingsCopy[i][j] = pairingsCopy[i][j].replace(ext[k], `@${ext[k]}`);
                    }
                }
                
            }

            // if you found a single Winner of/Loser of text...
            if (winLossIndex.length === 1) {
                // don't put an @ in front of the winner of/loser of
                if (winLossIndex == 0) {
                    const pairText = `${pairingsCopy[i][0]} VS @${pairingsCopy[i][1]}`;
                    pairTextArr.push(pairText);
                }
                else {
                    const pairText = `@${pairingsCopy[i][0]} VS ${pairingsCopy[i][1]}`;
                    pairTextArr.push(pairText);
                }
            }
            // or if both elements in the pair is a winner of/loser of text, don't add @ before either
            else {
                const pairText = `${pairingsCopy[i][0]} VS ${pairingsCopy[i][1]}`;
                pairTextArr.push(pairText);
            }
            
        }
        // the first call doesn't pass ext, so we need a separate conditional for that case
        // the logic is pretty much the same as above
        else if (winLossIndex.length) {
            if (winLossIndex.length === 1) {
                if (winLossIndex == 0) {
                    const pairText = `${pairingsCopy[i][0]} VS @${pairingsCopy[i][1]}`;
                    pairTextArr.push(pairText);
                }
                else {
                    const pairText = `@${pairingsCopy[i][0]} VS ${pairingsCopy[i][1]}`;
                    pairTextArr.push(pairText);
                }
            }
            else {
                const pairText = `${pairingsCopy[i][0]} VS ${pairingsCopy[i][1]}`;
                pairTextArr.push(pairText);
            }
        }
        
        // if there's no special text, then just put an @ before each
        else {
            const pairText = `@${pairings[i][0]} VS @${pairings[i][1]}`;
            pairTextArr.push(pairText);
        }

                   
    }



    // intialize a header to let the user know what each group is
    let headerOut = [''];
    if (makeExtBracket != true) {
        headerOut =  ['<br />[0,0] Bracket<br />'];
    }
    // loop over the array of pairings
    // we don't need to do this on the first round because we don't have to update the header (everyone has the same record)
    for (let i = 0; i < pairings.length; i++) {
        // only make a header past the first round and not for an extension bracket
        // we only need to consider the first user since the users in each pair have the same record
        if (bracket.standings && makeExtBracket == false) {
            // if the first user is Loser of, we can assume their loss number is one higher than what is stored
            if (pairings[i][0].includes('Loser of')) {
                let user = '';
                // get the name of the first user in the extension
                ext.some(name => {
                    user = name;
                    return pairings[i][0].includes(name) 
                });
                // get the record for the person in the extension
                let bracketRecord = JSON.parse(JSON.stringify(bracket.standings[user]));
                // add 1 to their loss
                bracketRecord[1]++;
                // update the header
                headerOut = ['<br />[' + bracketRecord.toString() + '] Bracket<br />'];
            }
            // same idea, but check for Winner of and add 1 to their wins
            else if (pairings[i][0].includes('Winner of')) {
                let user = '';
                // get the name of the first user in the extension
                ext.some(name => {
                    user = name;
                    return pairings[i][0].includes(name) 
                });
                // get the record for the person in the extension
                let bracketRecord = JSON.parse(JSON.stringify(bracket.standings[user]));
                // add 1 to their wins
                bracketRecord[0]++;
                // update the header
                headerOut = ['<br />[' + bracketRecord.toString() + '] Bracket<br />'];
            }
            // if it's just a name, we don't need to do anything special and can pull their records from storage
            else {
                headerOut = ['<br />[' + bracket.standings[pairings[i][0]].toString() + '] Bracket<br />'];
            }
            
        }
    }
    

    // push the copy/pastable output to the DOM
    let output;
    // if you're making an extension bracket, push it to the appropriate field
    if (makeExtBracket) {
        output = document.getElementById('output-ext');
    } else {
        output = document.getElementById('output-bracket');
    }
    
    // div to store the pairs
    const textDiv = document.createElement('div');
    
    // append the header for regular brackets
    if (makeExtBracket) {
        textDiv.innerHTML = pairTextArr.join('<br />');    
    }
    else {
        textDiv.innerHTML = headerOut.concat(pairTextArr).join('<br />');
    }
    
    // post to the dom
    output.appendChild(textDiv);

    

    // store the userlist and pairings 
    bracket['pairs'] = bracket['pairs'] || [];
    if (!makeExtBracket) {
        bracket['pairs'] = bracket['pairs'].concat(pairings);
    }
    localStorage.setItem(curBracket, JSON.stringify(bracket));
    sessionStorage.setItem('pairs', JSON.stringify(bracket['pairs']))

    // make the pairings into a form for the user to select the winner
    createWinnerForm(pairings, ext, makeExtBracket, curBracket, bracket);
    
}


/**
 * Builds the forms for the user to select the winner in each matchup
 * @param {*} pairs array of paired names
 * @param {*} ext array of names in an extension
 * @param {boolean} makeExtBracket flag to say whether it is making an extension or regular bracket
 * @param {string} curBracket name of the current bracket
 * @param {object} bracket obj from localStorage containing all of the information for this tournament
 */
function createWinnerForm(pairs, ext, makeExtBracket, curBracket, bracket) {
    let parentDiv, divID;
    // determine which div you should push to
    if (makeExtBracket) {
        parentDiv = document.getElementById('extensions');
        divID = 'ext';
    }
    else {
        parentDiv = document.getElementById('chooseWinners');
        divID = '';
    }
    
    // get the current number of chooseWinner forms and the children they contain
    const child = parentDiv.children;
    let childCount = 0;
    for (let element of child) {
        if (element.tagName == 'FORM') {
            childCount++;
        }
    }
    
    let grandChildCount = 0;
    for (let i = 0; i < child.length; i++) {
        grandChildCount += child[i].childElementCount;
    }

    // create the form to append to the parentDiv;
    const form = document.createElement('form');
    form.setAttribute('id', `${divID}winnerForm${childCount+1}`);
    // create a label for said form
    // only make a label for the regular brackets
    const label = document.createElement('label');
    if (makeExtBracket == false) {
        label.setAttribute('for', `${divID}winnerForm${childCount+1}`);
        label.style.cssText = 'margin: 20px 0px; display: inline-block;';
        parentDiv.appendChild(label);
    }
    
    // loop through the pairs
    for (let i = 0; i < pairs.length; i++) {
        // create a div to contain everything
        const div = document.createElement('div');
        div.setAttribute('id', `${divID}pair${i+grandChildCount}`);

        // make a box for the first user
        // store the intial information into a custom attribute so we can toggle the text
        const box1 = document.createElement("input");
        box1.setAttribute('type', 'checkbox');
        box1.setAttribute('value', pairs[i][0]);
        box1.setAttribute('data-default', pairs[i][0]);

        // update the header
        if (makeExtBracket == true) {
            div.setAttribute('data-bracket', 'Extension');
        }
        else {
            div.setAttribute('data-bracket', '[0,0] Bracket');
        }
        
        // if it's not the first round and you aren't making an extension bracket,
        // determine what the header should be based on their w/l ratio
        // we only care about the first entrant since both parties have the same ratio
        if (bracket.standings && makeExtBracket == false) {
            if (pairs[i][0].includes('Loser of')) {
                // get the name of the user in the extension
                let user = '';
                ext.some(name => {
                    user = name;
                    return pairs[i][0].includes(name) 
                });
                // get the record for the person in the extension
                let bracketRecord = JSON.parse(JSON.stringify(bracket.standings[user]));
                // add 1 to their loss
                bracketRecord[1]++;
                // update the label
                label.innerHTML = '[' + bracketRecord.toString() + '] Bracket';
                div.setAttribute('data-bracket', label.innerHTML);
            }
            else if (pairs[i][0].includes('Winner of')) {
                // get the name of the user in the extension
                let user = '';
                ext.some(name => {
                    user = name;
                    return pairs[i][0].includes(name) 
                });
                // get the record for the person in the extension
                let bracketRecord = JSON.parse(JSON.stringify(bracket.standings[user]));
                // add 1 to their win
                bracketRecord[0]++;
                // update the header
                label.innerHTML = '[' + bracketRecord.toString() + '] Bracket';
                div.setAttribute('data-bracket', label.innerHTML);
            }
            else {
                label.innerHTML = '[' + bracket.standings[pairs[i][0]].toString() + '] Bracket';
                div.setAttribute('data-bracket', label.innerHTML);
            }
            
        }
        
        // make a checkbox for the second player
        const box2 = document.createElement("input");
        box2.setAttribute('type', 'checkbox');
        box2.setAttribute('value', pairs[i][1]);
        box2.setAttribute('data-default', pairs[i][1]);


        // check if either box is a BYE
        // if so, disable the other box and make the form required
        if (box1.value === 'BYE') {
            box1.disabled = true;
            box2.required = true;
        }
        else if (box2.value === 'BYE') {
            box2.disabled = true;
            box1.required = true;
        }

        // if the form is for extensions, add an onChange event listener 
        // the event listener updates the text in the other forms from (Winner/Loser of ...) to the winner/loser name
        // this way if they get another extension, the code works as normal
        // also store that it has been checked so the DOM can be reloaded later with them checked
        if (makeExtBracket) {
            box1.addEventListener('change', function () {extWinnerChosen(this); storeChecked(this);} );
            box2.addEventListener('change', function () {extWinnerChosen(this); storeChecked(this);} );
        } else {
            box1.addEventListener('change', function () {storeChecked(this);} );
            box2.addEventListener('change', function () {storeChecked(this);} );
        }

        // make the A vs B text
        const pairText = document.createElement('span');
        pairText.innerHTML =  `${box1.value} VS ${box2.value}`;
        pairText.setAttribute('data-default', `${box1.value} VS ${box2.value}`);

        // attach everything to the form
        div.appendChild(box1);
        div.appendChild(pairText);
        div.appendChild(box2);
        form.appendChild(div);
    }

    // post the form to the div
    parentDiv.appendChild(form);
    

    // store the current DOM state to local storage
    const curDOM = document.getElementById('pageContent').innerHTML;
    bracket['DOM'] = curDOM;
    localStorage.setItem(curBracket,JSON.stringify(bracket));
    
}

/**
 * Retrieves the checked boxes from the forms so that we can update the wins and loses for each player
 * @calls updatewL() 
 */
function advanceRound() {
    // get the current bracket from storage
    const curBracket = sessionStorage.getItem('currentBracket');
    let bracket = JSON.parse(localStorage.getItem(curBracket));

    // get a list of all of the winners (checked) and losers (unchecked)
    const winners = [...document.querySelectorAll( "input[type=checkbox]:not(#parseBracketMakerOption,#player1Check,#player2Check):checked" )];
    const losers = [...document.querySelectorAll('input[type=checkbox]:not(#parseBracketMakerOption,#player1Check,#player2Check):not(:checked)')];

    // check to make sure the winners of the extensions are selected
    const extBracketChildNodeCount = document.getElementById('extensions').childNodes.length;
    const extWinners = [...document.querySelectorAll("#extensions :checked")];

    // if the number of checked boxes in the extensions div is less than the number of forms, they didn't chose a winner
    // throw an error
    if (extWinners.length < extBracketChildNodeCount) {
        alert ('The winner of the extension must be decided!');
        return;
    }

    // get the parent nodes of each match
    const parentNodesW = [];
    let parentNodesL = [];
    const winnerNames = [];
    let loserNames = [];
    let extension = [];
    let extNames = [];

    winners.forEach(e => {
        parentNodesW.push(e.parentNode.id);
        winnerNames.push(e.value);
    });


    losers.forEach(e => {
        parentNodesL.push(e.parentNode.id);
        loserNames.push(e.value);
    })

    // check for duplicated winner parent nodes
    // duplicated parents means they chose 2 winners from the same round
    const dupFoundW = hasDuplicates(parentNodesW);

    if (dupFoundW) {
        alert('You cannot have two winners in a matchup!');
        return;
    }

    // check for duplicated loser parent nodes
    // duplicated parents means there was an extension
    const dupFoundL = hasDuplicates(parentNodesL);

    // if you found a dupe, get the element associated with it
    if (dupFoundL) {
        extension = findDuplicates(parentNodesL);
    }

    // nodes that are not repeated in parentNodesL played and lost
    // nodes that are repeated got an extension
    // updated the names of the losers to only have the players who lost
    extension.forEach(e => {
        // get the index of the repeated entry in the 
        const extIndex = parentNodesL.indexOf(e);

        // log this entry and entry+1 to the extNames array
        extNames.push(loserNames.slice(extIndex,extIndex+2));
        // remove this entry, and entry + 1
        loserNames.splice(extIndex, 2);
        parentNodesL.splice(extIndex, 2);
    })

    // make sure they didn't extend a bye
    if (extNames.some(name => name.includes('BYE'))) {
        alert('You cannot extend a BYE');
        return;
    }

    // output the results for the determined winners
    // pass in the winner and extension nodes
    if (parentNodesW.length) {
        postResults(parentNodesW, 'results');
    }
    if (extNames.length) {
        postResults(extNames, 'results-ext');
    }
    


    // get the pairs (updated with extension winners/losers) from the storage and save it
    bracket['pairs'] = JSON.parse(sessionStorage.getItem('pairs'));
    
    // reduce the number of rounds remaining
    bracket['roundsRemaining']--
    // re-save to storage
    document.getElementById('rounds').innerHTML = bracket.roundsRemaining;
    localStorage.setItem(curBracket, JSON.stringify(bracket));

    // if there aren't any rounds left, prep for the final round
    if (bracket['roundsRemaining'] == 0) {
        finalRound();
    }

    // update the w/l numbers in storage
    updateWL(winnerNames, loserNames, extNames, curBracket, bracket);
}

/**
 * Updates the win/loss numbers for each user and saves it to storage
 * @param {string[]} winnerNames names of the winners
 * @param {string[]} loserNames names of the losers
 * @param {*} extNames names of the people given an extension
 * @param {string} curBracket name of the current bracket
 * @param {object} bracket object containing all of the info for this tournament
 */
function updateWL(winnerNames, loserNames, extNames, curBracket, bracket) {
    let userlist = bracket['participants'];
    let standings = bracket['standings'];

    // check for null
    // if null, initialize to empty set
    // null means this is the first round
    if (standings == null) {
        standings = {};
    } else {
        standings = standings;
        userlist = winnerNames.concat(loserNames);
    }
    
    // if someone quit, remove their name.
    // if the person quit and was in an extension, replace their name with a BYE
    if (bracket.quits) {
        bracket.quits.forEach(name => {
            if (userlist.includes(name)) {
                for (let i = 0; i < userlist.length; i++) {
                    if (userlist[i] == name) {
                        userlist.splice(i, 1);
                    }
                }
            }
            for (let i = 0; i < extNames.length; i ++) {
                if (extNames[0] == name) {
                    extNames[0] = 'BYE';
                }
                else if (extNames[1] == name) {
                    extNames[1] = 'BYE';
                }
            }
        })
    }
    
    

    // loop over the list of usernames so we can update their records
    for (const username of userlist) {
        // if it's in the list of winners, increment W count
        if (winnerNames.includes(username) && username != 'BYE') {
            // get the index
            const index = winnerNames.indexOf(username);
            // remove that element from the winnerNames list so we don't count it twice
            winnerNames.splice(index, 1);
            // update the records
            standings[username] = [(standings[username]?.[0] || 0) + 1, standings[username]?.[1] || 0];
        }
        // if they're in the list of losers, increment L count
        else if (loserNames.includes(username) && username != 'BYE') {
            // get the index
            const index = loserNames.indexOf(username);
            // remove that element from the winnerNames list so we don't count it twice
            loserNames.splice(index, 1);
            // update the records
            standings[username] = [(standings[username]?.[0] || 0), (standings[username]?.[1] || 0) + 1];
        }
        // else it's an extension, don't update the numbers
        else if (username != 'BYE') {
            standings[username] = [(standings[username]?.[0] || 0), standings[username]?.[1] || 0];
        }
        
    }

    // update the storage variable
    bracket['standings'] = standings;

    // output the standings to the DOM
    postStandings(standings, extNames);

    // store
    localStorage.setItem(curBracket, JSON.stringify(bracket));

    // make the new pairings
    newPairs(standings, extNames);
}

/**
 * Groups the users based on their records
 * @param {object} standings 
 * @param {*} extNames 
 * @calls makeBracket()
 */
function newPairs(standings, extNames) {

    // loop through the array of extension names
    // assume the left person won for the sake of advancing the tournament one round
    let allExtNames = []
    for (let i = 0; i < extNames.length; i++) {
        // get the names
        let tempWinner = extNames[i][0];
        let tempLoser = extNames[i][1];

        // temp update the standings
        standings[tempWinner][0]++;
        standings[tempLoser][1]++;

        // log the names
        allExtNames.push(...extNames[i]);
    }

    // loop through the list of names and organize them based on their current W/L numbers
    // create an array of the standings
    const ratios = Object.values(standings);
    const names = Object.keys(standings);

    // get the unique values
    const uniq = ratios.filter((a = {}, b => !(a[b] = b in a)));

    // pair up the names based on the W/L ratios
    const groups = [];
    // loop over the list of unique ratios
    for (let i = 0; i < uniq.length; i++) {
        let array1 = uniq[i];
        let indices = [];
        // loop over the array of all of the ratios for all of the users
        for (let j = 0; j < ratios.length; j++) {
            let array2 = ratios[j];

            // check if the users have the same ratio as the test
            // ratios are in the form [W, L]
            let is_same = array1.length == array2.length && array1.every(function(element, index) {
                return element === array2[index]; 
            });
             
            // get the name of the person with this ratio
            let name = names[j];

            // if the ratio is the same as the test and their name isn't in the list of extensions, log it
            if (is_same && !allExtNames.includes(name)) {
                indices.push(name);
            }  
            // else if it is the same as the test and they are given an extension
            else if (is_same && allExtNames.includes(name)) {
                // get the index of the extension pair
                let pairIndex = extNames.findIndex(extCombo => extCombo.some(ext => ext === name));

                // because we force the left person to win, we can compare whether the name is equal to the left or right entry
                // if it's the left entry, we know it's a theoretical win
                // else, it's a theoretical loss
                if (name == extNames[pairIndex][0]) {
                    indices.push(`(Winner of ${extNames[pairIndex][0]} VS ${extNames[pairIndex][1]})`);
                }
                else {
                    indices.push(`(Loser of ${extNames[pairIndex][0]} VS ${extNames[pairIndex][1]})`);
                }
                
            }
        }
        groups.push(indices);
    }
    // clear the fields so they don't build up
    resetWinners();

    // if there are people who are granted an extension, push that to the extension bracket
    if (extNames.length) {
        for (let i = 0; i < extNames.length; i++) {
            makeBracket(null, extNames[i], true);
        }
    }


     // build the main bracket
    for (let i = 0; i < groups.length; i++) {
        makeBracket(groups[i], allExtNames, false);
    }
}


/**
 * Calculates the records on the final round and pushes the information to the DOM
 * @returns void
 */
function calcFinalScore() {
    // get a list of all of the winners (checked) and losers (unchecked)
    const winners = [...document.querySelectorAll( "input[type=checkbox]:not(#parseBracketMakerOption,#player1Check,#player2Check):checked" )];
    const losers = [...document.querySelectorAll('input[type=checkbox]:not(#parseBracketMakerOption,#player1Check,#player2Check):not(:checked)')];
   
    // get the parent nodes of each
    const parentNodesW = [];
    let parentNodesL = [];
    const winnerNames = [];
    let loserNames = [];

    winners.forEach(e => {
        parentNodesW.push(e.parentNode.id);
        winnerNames.push(e.value);
    });


    losers.forEach(e => {
        parentNodesL.push(e.parentNode.id);
        loserNames.push(e.value);
    })

    // check for duplicated winner parent nodes
    // duplicated parents means they chose 2 winners from the same round
    const dupFoundW = hasDuplicates(parentNodesW);

    if (dupFoundW) {
        alert('You cannot have two winners in a matchup!');
        return;
    }

    // check for duplicated loser parent nodes
    // duplicated parents means there was an extension
    const dupFoundL = hasDuplicates(parentNodesL);

    // if you found a dup, get the element associated with it
    if (dupFoundL) {
        alert('You must have a winner in each matchup!');
        return;
    }

    // output the results for the determined winners
    // pass in the winner nodes
    if (parentNodesW.length) {
        postResults(parentNodesW, 'results');
    }

    // hide the calc final score button and clear the old standings
    document.getElementById('advance').style.display = 'none';
    document.getElementById('standings').innerHTML = '';

    // get the bracket info from storage
    const userlist = winnerNames.concat(loserNames);
    const curBracket = sessionStorage.getItem('currentBracket');
    let bracket = JSON.parse(localStorage.getItem(curBracket));
    let standings = bracket['standings'] || {};

    // loop over the list of users so we can update their ratios
    for (const username of userlist) {
        // if it's in the list of winners, increment W count
        if (winnerNames.includes(username)) {
            // get the index
            const index = winnerNames.indexOf(username);
            // remove that element from the winnerNames list so we don't count it twice
            winnerNames.splice(index, 1);
            // update the records
            standings[username] = [(standings[username]?.[0] || 0) + 1, standings[username]?.[1] || 0];
        }
        // if they're in the list of losers, increment L count
        else if (loserNames.includes(username)) {
            // get the index
            const index = loserNames.indexOf(username);
            // remove that element from the winnerNames list so we don't count it twice
            loserNames.splice(index, 1);
            // update the records
            standings[username] = [(standings[username]?.[0] || 0), (standings[username]?.[1] || 0) + 1];
        }
    }

    // update storage variable
    bracket['standings'] = standings;
    // get the temp pairs (updated with extention winners/losers) from the session storage and save it to local 
    bracket['pairs'] = JSON.parse(sessionStorage.getItem('pairs'));
    localStorage.setItem(curBracket, JSON.stringify(bracket));

    // get the entries in the standings object for sorting
    let finalResults = Object.entries(standings);

    finalResults = finalResults.sort(function (a,b) {
        // a and b are adjacent elements in the array
        // the array is sorted based on whether the differential is higher or lower
        // the differential is calculated based on Wins - Losses
        // this sorts the array with highest differential first
        return (b[1][0] - b[1][1]) - (a[1][0] - a[1][1]);
    });

    // calculate resistances
    const modFinalResults = calcResist(finalResults, bracket);

    // build an array of strings for output
    const strOut = ['Format is:  Win,Loss (Avg Opp Win % | Avg Opp Opp Win %)<br />'];

    for (let i = 0; i < modFinalResults.length; i++) {
        if (modFinalResults[i][0] == 'BYE') {
            continue;
        }
        const str = `@${modFinalResults[i][0]}: ${modFinalResults[i][1]} (${modFinalResults[i][2]}% | ${modFinalResults[i][3]}%)`;
        strOut.push(str);
    }
    // post the final results to the dom
    document.getElementById('current-output').innerHTML = strOut.join('<br />');
    document.getElementById('current').innerHTML = 'Final Results';

    // output the standings of the users who quit
    let quitFinalResults = [];
    if (bracket.quitStandings) {
        quitFinalResults = Object.entries(bracket.quitStandings);
    }
    
    // calc resistance for quits
    const modQuitFinalResults = calcResist(quitFinalResults, bracket);

    // build array for output
    const quitStrOut = [];
    if (modQuitFinalResults.length) {
        quitStrOut.push('Format is:  Win,Loss (Avg Opp Win % | Avg Opp Opp Win %)<br />');
        for (let i = 0; i < modQuitFinalResults.length; i++) {
            if (modQuitFinalResults[i][0] == 'BYE') {
                continue;
            }
            const str = `@${modQuitFinalResults[i][0]}: ${modQuitFinalResults[i][1]} (${modQuitFinalResults[i][2]}% | ${modQuitFinalResults[i][3]}%)`;
            quitStrOut.push(str);
        }
    }
    

    if (quitStrOut.length) {
        document.getElementById('quitResults').innerHTML = quitStrOut.join('<br />');
        document.getElementById('quitStandings').style.display = 'block';
    }



    // store the results to the local storage so you don't keep adding wins on reload
    const curDOM = document.getElementById('pageContent').innerHTML;
    bracket['DOM'] = curDOM;
    localStorage.setItem(curBracket,JSON.stringify(bracket));

}



/**
 * Calculates the players resistance, defined as avg Op Win % and avg Op Op Win %
 * @param {*} finalResults Array of array containing names and W/L records
 * @param {*} bracket DOM
 * @returns 
 */
function calcResist(finalResults, bracket) {
    const modFinalResults = [];
    // loop over the list of final results to calc the Op W % and Op Op Win %
    for (const user of finalResults) {
        // get all of the opponents they faced throughout the tourney
        // first extract the username of the person we want to look for
        const username = user[0];

        // get the list of their opponents
        const oppArr = getOpp(username, bracket);

        // get the avg win percentage of their opp
        const avgOppWP = getOppWinPercent(oppArr, finalResults);

        // loop over the list of opp and get their opp win percent
        const tempOppOppWP = [];
        for (const opp of oppArr) {
            const oppOppArr = getOpp(opp, bracket);
            // get the win percent of their opp's
            const oppOppWP = getOppWinPercent(oppOppArr, finalResults);
            // push to temp array
            tempOppOppWP.push(oppOppWP);
        }
        
        // find the average of the opp opp win %
        const avgOppOppWP = (tempOppOppWP.reduce( (a,b) => (Number(a)+Number(b)), 0) / (tempOppOppWP.length === 0 ? 1 : tempOppOppWP.length)).toFixed(2);

        // add it to the final results array
        user.push(avgOppWP);
        user.push(avgOppOppWP);

        // add it to the final array for output
        modFinalResults.push(user);
        

    }
    return modFinalResults;
}


/**
 * Looks through the list of games and returns an array containing their opponents throughout the tournament
 * @param {string} username Name of player
 * @param {*} bracket DOM
 * @returns 
 */
function getOpp(username, bracket) {
    // get the matchups that include this user
    // bracket.pairs shouldn't be null, but the check is from an old bug
    const matchArr = bracket.pairs?.filter(p => p.some(uname => uname === username)) ?? [];

    if (!matchArr.length) {
        return [];
    }
    // get the list of opp names
    const oppArr = matchArr.map(oppname => oppname.find(name => name !== username));

    return oppArr;
    
}


/**
 * Calculates the average win percentage of the provided array of names
 * @param {string[]} oppArr Array of opponent names
 * @param {*} finalResults Array of array containing player names and W/L records
 * @returns 
 */
function getOppWinPercent(oppArr, finalResults) {
    // loop over the list of opp names
    const tempOppWP = [];
    for (const opp of oppArr) {
        // if it's a BYE, skip
        if (opp === 'BYE') {
            continue;
        }
        // get their final results
        const oppResultFind = finalResults.find(arr => arr[0] === opp);

        const oppResult = oppResultFind ? oppResultFind[1] : [0, 1];
        const winPercent = oppResult[0] / (oppResult[0] + oppResult[1]);
        tempOppWP.push(winPercent);
    }

    // calc the average oppWP
    avgOppW = tempOppWP.reduce((a,b) => (a + b), 0) / (tempOppWP.length === 0 ? 1 : tempOppWP.length);

    return (avgOppW * 100).toFixed(2);
}


function addMatch() {
    // get the entered names
    const userField1 = document.getElementById('player1Field');
    const userField2 = document.getElementById('player2Field');
    const userCheckbox1 = document.getElementById('player1Check');
    const userCheckbox2 = document.getElementById('player2Check');
    const user1 = userField1.value;
    const user2 = userField2.value;
    const users = [user1, user2];

    // check for blank
    if (user1 == '' || user2 == '') {
        alert('You must enter a username.');
        return;
    }
    // check for same name
    if (user1 == user2) {
        alert('Users cannot play themselves, unless you\'re DJ Khaled!');
        return;
    }

    // check for both checked or none checked
    if ((userCheckbox1.checked && userCheckbox2.checked) || (!userCheckbox1.checked && !userCheckbox2.checked)) {
        alert('You must select 1 winner');
        return;
    }

    // get the name of the current bracket from the session storage
    const curBracket = sessionStorage.getItem('currentBracket') || '';

    // check for no active bracket
    if (curBracket == '') {
        alert('You must load or make a bracket first!');
        return;
    }

    // retreive the same item from local storage to save the data across sessions
    let bracket = JSON.parse(localStorage.getItem(curBracket)) || '';

    if (bracket == '') {
        alert('Desired bracket not found.');
        return;
    }

    // update the participants
    let participants = bracket.participants || [];
    for (const user of users) {
        // if the user is not already a player, add them
        if (!participants.includes(user)) {
            participants.push(user);
        } else {
            continue;
        }
    }

    bracket.participants = participants;
    

    // update the standings
    const standings = bracket.standings || {};
    let idx = 0;
    for (const user of users) {
        if (idx === 0) {
            // if left box checked, increment win of first user
            // else, increment loss
            if (userCheckbox1.checked) {
                standings[user] = [standings[user] + 1 || 1, standings[user] || 0];
            }
            else {
                standings[user] = [standings[user] || 0, standings[user] + 1 || 1];
            }
        }
        else {
            // if second box checked, increment win of second user
            // else, increment loss
            if (userCheckbox2.checked) {
                standings[user] = [standings[user] + 1 || 1, standings[user] || 0];
            }
            else {
                standings[user] = [standings[user] || 0, standings[user] + 1 || 1];
            }
        }
        idx++;
    }

    bracket.standings = standings;

    // update the pairs
    if (bracket.pairs) {
        bracket.pairs.push(users);
    }
    else {
        bracket.pairs = [users];
    }
    

    // reset the input fields
    userField1.value = '';
    userField2.value = '';
    userCheckbox1.checked = false;
    userCheckbox2.checked = false;
    alert('Game results added!');


    // repost to DOM
    localStorage.setItem(curBracket, JSON.stringify(bracket));
    sessionStorage.setItem('pairs', JSON.stringify(bracket['pairs']))

}