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
    if (bracket.origin != 'validate') {
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

    // reset the selected index to 0
    bracketSelect.selectedIndex = 0;

    // put the usernames back
    if (bracket.participants) {
        document.getElementById('inputBox').value = bracket.participants.join('\n');
    }

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
    
    // reset the dom to its initial state
    const initialDOM = JSON.parse(sessionStorage.getItem('initialDOM'));
    document.getElementById('pageContent').innerHTML = initialDOM;

    // save the name and rounds remaining to local storage
    let bracket = {};
    bracket['DOM'] = initialDOM;
    bracket['origin'] = 'validate';

    localStorage.setItem(name, JSON.stringify(bracket));

    // use the sessionStorage to save the name of the current bracket being used
    sessionStorage.setItem('currentBracket', name);
    sessionStorage.removeItem('pairs');

    // display the rest of the DOM so the user can input the players
    document.getElementById('pageContent').style.display = 'block';
    document.getElementById('curBrackName').innerHTML = name;
    

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
 * Checks whether the matchups provided have occurred before.
 * Returns true/false if there is a duplicated matchup.
 * Returns void if invalid textarea input.
 * @returns boolean | void
 */
function compareMatches() {
    // get the current bracket
    const curBracket = sessionStorage.getItem('currentBracket');
    let bracket = JSON.parse(localStorage.getItem(curBracket));

    // get the names from the input
    // in form [user1, user2]
    let providedNames = parseBM();

    // check for blank
    // check for blank input
    if (providedNames.length == 0) {
        alert('No match input found!');
        return;
    }

    // if we have saved pairs, check to see if any of the entries are the same
    if (bracket.pairs) {
        // create a temp array that concats the info saved with that provided
        const pairCompArr = providedNames.concat(bracket.pairs);  
        
        // check for any duplicated entries by first getting all of the unique entries
        const uniq = pairCompArr.filter((a = {}, b => !(a[b] = b in a || b.slice().reverse() in a)));

        // then checking if the lengths match
        // if they don't, there's a duplicated matchup
        // if a duplicate is found, let the user know and return which entry is duplicated
        if (uniq.length != pairCompArr.length) {
            const dupes = findDuplicates(pairCompArr);
            if (dupes.length) {
                const arrOut = [];
                for (let i = 0; i < dupes.length; i++) {
                    const strOut = `${dupes[i][0]} vs ${dupes[i][1]}`;
                    arrOut.push(strOut);
                }
                document.getElementById('dupe-results').innerHTML = `<span style='color: red;'><strong>Duplicate matchups found:</strong></span><br /><br />${arrOut.join('<br />')}`;
                return true;
            }
        }

        document.getElementById('dupe-results').innerHTML = "<span style='color: green;'><strong>No duplicate matchups found!</strong></span>";
        return false;

    } 
    // else, save the array of provided matchups to storage
    else {
        // bracket['pairs'] = providedNames;
        // localStorage.setItem(curBracket, JSON.stringify(bracket));
        document.getElementById('dupe-results').innerHTML = "<span style='color: green;'><strong>No duplicate matchups found!</strong></span>";
        return false;
    }
}

/**
 * Updates the W/L records based on the winner names provided
 * Provided games are given a W, names present in the matchup but not listed
 * as winners get a L
 * @calls postStandings()
 */
function updateWL() {
    // get the current bracket
    // get the current bracket
    const curBracket = sessionStorage.getItem('currentBracket');
    let bracket = JSON.parse(localStorage.getItem(curBracket));

    // get the names from the input
    // in form [user1, user2]
    let providedNames = parseBM();
    
    // check for blank input
    if (providedNames.length == 0) {
        alert('No match input found!');
        return;
    }
    
    // turn the provided pairs into a list of names
    let providedNamesList = [];
    providedNames.forEach(pair => {
        providedNamesList.push(pair[0]);
        providedNamesList.push(pair[1]);
    });

    // get the list of winners
    let providedWinners = document.getElementById('winLossBox').value.split(/[\r?\n]+/);
    // remove blank entries
    providedWinners = providedWinners.filter(winner => winner);

    // check if blank
    if (providedWinners == '') {
        alert('No winner input found!');
        return;
    }

    // check to make sure there are no duplicated matchups
    const hasOldMatchups = compareMatches();
    if (hasOldMatchups == true) {
        alert('There are duplicate matchups! Please remove them before proceeding.');
        return;
    }

    // make sure each match has a winner
    if (providedWinners.length != providedNamesList.length / 2) {
        alert('Each matchup needs a winner!');
        return;
    }

    let standings = bracket.standings || {};
    // add 1 W to the list of winners
    // loop over the list of usernames so we can update their records
    for (const username of providedWinners) {
            // get the index of the name in the provided names list
            const index = providedNamesList.indexOf(username);

            // remove the name from the provided names list
            if (index >= 0) {
                providedNamesList.splice(index, 1);
            }
            // update the records for the winners
            standings[username] = [(standings[username]?.[0] || 0) + 1, standings[username]?.[1] || 0];
    }
        
    // providedNamesList is now a list of the losers
    // loop over it to update the loss counts
    for (const username of providedNamesList) {
        if (username.toLowerCase() == 'bye') {
            continue;
        }
        else {
            standings[username] = [(standings[username]?.[0] || 0), (standings[username]?.[1] || 0) + 1];
        }
    }

    // store the standings and pairs
    bracket['standings'] = standings;
    if (bracket.pairs) {
        bracket.pairs = bracket.pairs.concat(providedNames);

    } else {
        bracket['pairs'] = providedNames;
    }
    

    // update storage
    localStorage.setItem(curBracket, JSON.stringify(bracket));

    // post the brackets to the DOM
    postStandings(bracket);
}

/**
 * Groups the users together based on their records and posts the groups to the DOM
 * @param {object} obj object that contains all of the info for this tournament
 */
function postStandings(obj) {
    // get the entries in the standings object for sorting
    let finalResults = Object.entries(obj.standings);
    const ratios = Object.values(obj.standings);
    const names = Object.keys(obj.standings);

    // calc the resistance
    const modFinalResults = calcResist(finalResults, obj);

    // get the unique values
    const uniq = ratios.filter((a = {}, b => !(a[b] = b in a)));

    // pair up the names based on the W/L ratios
    const arrOut = ['Format is: username (Avg Opp Win % | Avg Opp Opp Win %)'];

    // loop over the list of unique ratios
    for (let i = 0; i < uniq.length; i++) {
        let array1 = uniq[i];
        let strOut = ['<br />[' + array1.toString() + '] Bracket<br />'];
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
            if (is_same) {
                // find the name in the list of modified final results (the arr containing the op win %)
                const elem = modFinalResults.find(row => row[0] === name);
                const strOut = `${name} (${elem[2]}% | ${elem[3]}%)`;
                indices.push(strOut);
            }  
        }
        // join the header with the names
        strOut = strOut.concat(indices).join('<br />');
        // append to the string to be pushed to the DOM
        arrOut.push(strOut);
    }

   
    

    document.getElementById('standings').innerHTML = arrOut.join('<br />');
}



/**
 * Gets the repeated entry in an array
 * @param {*} array 
 * @returns {*} array of repeated entries
 */
// function to find duplicate entries in an array
function findDuplicates(array) {
    // make a copy and sort the array of usernames
    let sortedArr = array.slice().sort();
    let results = [];
    // loop through the sorted array
    // if adjacent entries are the same, log this value to the results array
    for (let i = 0; i < sortedArr.length - 1; i++) {
        let isSame = sortedArr[i].length == sortedArr[i+1].length && sortedArr[i].every(function(element, index) {
            return element === sortedArr[i+1][index]; 
        });
        if (isSame) {
            results.push(sortedArr[i]);
        }
    }

    // check for duplicates
    for (let i = 0; i < sortedArr.length; i++) {
        for (let j = i; j < sortedArr.length; j++) {
            if (sortedArr[i][0] == sortedArr[j][1] && sortedArr[i][1] == sortedArr[j][0]) {
                results.push(sortedArr[i]);
                sortedArr.splice(j,1);
            }
        }
    }

    return results;
}


/**
 * Parses the provided input of usernames using the bracket maker syntax of A vs B
 * Extracts a list of names of all of the users
 * @returns string array
 */
 function parseBM() {
    // get the input
    let providedNames = document.getElementById('inputBox').value.split(/[\r\n]+/);
    providedNames = providedNames.filter(match => match);

    // loop over the input to match the regex of the names
    const participants = [];

    for (let i = 0; i < providedNames.length; i++) {
        const parsedMatchup = providedNames[i].match(/@(\S+.+) \u202Fvs\u202F @(\S+.+)/, 'g')
        if (parsedMatchup === null) {
            alert('Unable to parse input. Make sure the format is correct and is not blank.');
            break;
        }
        // log the names
        participants.push([parsedMatchup[1], parsedMatchup[2]]);
    }
    
    return participants;
}





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



function getOpp(username, bracket) {
    // get the matchups that include this user
    const matchArr = bracket.pairs.filter(p => p.some(uname => uname === username));

    // get the list of opp names
    const oppArr = matchArr.map(oppname => oppname.find(name => name !== username));

    return oppArr;
    
}


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