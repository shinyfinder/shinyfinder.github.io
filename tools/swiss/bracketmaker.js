"use strict";
window.onload = function () {
    document.getElementById('bracket-file-input').addEventListener('change', importBracket, false);
    const curMode = localStorage.getItem('mode');
    if (curMode === null) {
        localStorage.setItem('mode', 'light');
    }
    else if (curMode == 'light') {
        document.body.classList.remove('dark-mode');
    }
    else if (curMode == 'dark') {
        localStorage.setItem('mode', 'dark');
    }
    const brackets = localStorage;
    if (brackets.length) {
        const bracketNames = Object.keys(brackets);
        const modeIndex = bracketNames.indexOf('mode');
        bracketNames.splice(modeIndex, 1);
        const sel = document.getElementById('bracketSelect');
        bracketNames.forEach((name, key) => {
            sel[key + 1] = new Option(name, `${key + 1}`);
        });
    }
    const initialDOM = document.getElementById('pageContent').innerHTML;
    sessionStorage.setItem('initialDOM', JSON.stringify(initialDOM));
};
function loadBracket() {
    const bracketSelect = document.getElementById('bracketSelect');
    if (bracketSelect.selectedIndex == 0) {
        return;
    }
    const text = bracketSelect.options[bracketSelect.selectedIndex].innerHTML;
    const bracket = JSON.parse(localStorage.getItem(text));
    if (bracket.origin !== 'manage') {
        alert('Bracket not made in this mode. Please load on the other page.');
        bracketSelect.selectedIndex = 0;
        return;
    }
    sessionStorage.setItem('currentBracket', text);
    const pageInfo = document.getElementById('pageContent');
    pageInfo.innerHTML = bracket.DOM;
    pageInfo.style.display = 'block';
    document.getElementById('curBrackName').innerHTML = text;
    const extCheckBoxes = document.querySelectorAll('#extensions input[type=checkbox]');
    if (extCheckBoxes.length) {
        extCheckBoxes.forEach(e => {
            e.addEventListener('change', function () { extWinnerChosen(this); storeChecked(this); });
        });
    }
    const bracketCheckBoxes = document.querySelectorAll('#chooseWinners input[type=checkbox]');
    if (bracketCheckBoxes.length) {
        bracketCheckBoxes.forEach(e => {
            e.addEventListener('change', function () { storeChecked(this); });
        });
    }
    const finalBtn = document.getElementById('advance');
    if (finalBtn.innerHTML == 'Calc Final Scores') {
        finalBtn.addEventListener('click', function () { calcFinalScore(); });
    }
    bracketSelect.selectedIndex = 0;
    if (bracket.participants) {
        const ib = document.getElementById('inputBox');
        ib.value = bracket.participants.join('\n');
    }
    const checkedBoxes = document.querySelectorAll('.checked');
    for (let i = 0; i < checkedBoxes.length; i++) {
        checkedBoxes[i].checked = true;
    }
    document.getElementById('rounds').innerHTML = `${bracket.roundsRemaining}`;
    sessionStorage.setItem('pairs', JSON.stringify(bracket.pairs ?? []));
}
function deleteBracket() {
    const bracketSelect = document.getElementById('bracketSelect');
    if (bracketSelect.selectedIndex === 0) {
        return;
    }
    const text = bracketSelect.options[bracketSelect.selectedIndex].innerHTML;
    const confirmText = `You are about to delete bracket ${text}. This action cannot be undone!\nContinue?`;
    if (confirm(confirmText) == true) {
        localStorage.removeItem(text);
        bracketSelect.selectedIndex = 0;
    }
}
function newBracket() {
    const nameInput = document.getElementById('bracketName');
    const name = nameInput.value;
    nameInput.value = '';
    if (name == '') {
        alert('You must enter a name for the bracket');
        return;
    }
    let allBracketNames = Object.keys(localStorage);
    if (allBracketNames.includes(name)) {
        alert('A bracket of this name already exists! Please choose a different name.');
        return;
    }
    const roundEl = document.getElementById('numRounds');
    const numRounds = parseInt(roundEl.value);
    if (isNaN(numRounds)) {
        alert('Invalid number of rounds entered. Please enter an integer at least 1.');
        return;
    }
    const initialDOM = JSON.parse(sessionStorage.getItem('initialDOM'));
    document.getElementById('pageContent').innerHTML = initialDOM;
    const bracket = {};
    bracket['DOM'] = initialDOM;
    bracket['roundsRemaining'] = numRounds;
    bracket['origin'] = 'manage';
    localStorage.setItem(name, JSON.stringify(bracket));
    sessionStorage.setItem('currentBracket', name);
    sessionStorage.removeItem('pairs');
    document.getElementById('pageContent').style.display = 'block';
    document.getElementById('curBrackName').innerHTML = name;
    document.getElementById('rounds').innerHTML = `${numRounds}`;
    allBracketNames = Object.keys(localStorage);
    const modeIndex = allBracketNames.indexOf('mode');
    allBracketNames.splice(modeIndex, 1);
    const sel = document.getElementById('bracketSelect');
    allBracketNames.forEach((name, key) => {
        sel[key + 1] = new Option(name, `${key + 1}`);
    });
}
function exportBracket() {
    const bracketSelect = document.getElementById('bracketSelect');
    if (bracketSelect.selectedIndex === 0) {
        return;
    }
    const text = bracketSelect.options[bracketSelect.selectedIndex].innerHTML;
    const bracket = localStorage.getItem(text);
    const blob = new Blob([bracket], { type: 'application/json' });
    const a = document.createElement('a');
    const filename = text.replace(/[/\\?%*:|"<>]/g, '-');
    a.download = `${filename}-export.txt`;
    a.href = URL.createObjectURL(blob);
    a.addEventListener('click', (e) => {
        setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
    });
    a.click();
}
function importBracket(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }
    const filename = file.name;
    const bracketName = filename.substr(0, filename.lastIndexOf("."));
    if (!bracketName) {
        alert('Invalid file imported.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        const contents = e.target.result;
        if (contents) {
            localStorage.setItem(bracketName, contents);
        }
        location.reload();
    };
    reader.readAsText(file);
}
function resetWinners() {
    document.getElementById('chooseWinners').innerHTML = '';
    document.getElementById('extensions').innerHTML = '';
    document.getElementById('output-ext').innerHTML = '';
    document.getElementById('output-bracket').innerHTML = '';
    return;
}
function storeChecked(e) {
    e.classList.toggle('checked');
    const curBracket = sessionStorage.getItem('currentBracket');
    const bracket = JSON.parse(localStorage.getItem(curBracket));
    const curDOM = document.getElementById('pageContent').innerHTML;
    bracket['DOM'] = curDOM;
    localStorage.setItem(curBracket, JSON.stringify(bracket));
}
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
    return array;
}
function hasDuplicates(array) {
    return (new Set(array)).size !== array.length;
}
function findDuplicates(array) {
    const sortedArr = array.slice().sort();
    const results = [];
    for (let i = 0; i < sortedArr.length - 1; i++) {
        if (sortedArr[i + 1] == sortedArr[i]) {
            results.push(sortedArr[i]);
        }
    }
    return results;
}
function extWinnerChosen(e) {
    const matchup = e.nextSibling === null ? e.previousSibling.innerHTML : e.nextSibling.innerHTML;
    const name = e.value;
    const opp = e.nextElementSibling === null ? e.previousElementSibling.previousElementSibling.value : e.nextElementSibling.nextElementSibling.value;
    const oppElem = e.nextElementSibling === null ? e.previousElementSibling.previousElementSibling : e.nextElementSibling.nextElementSibling;
    const curBracket = sessionStorage.getItem('currentBracket');
    const bracket = JSON.parse(localStorage.getItem(curBracket));
    const oldPairsOrig = bracket['pairs'];
    const oldPairs = JSON.parse(sessionStorage.getItem('pairs')) || JSON.parse(JSON.stringify(bracket['pairs']));
    if (e.checked && !oppElem.checked) {
        const brackets = [...document.getElementById('chooseWinners').children];
        for (let i = 0; i < brackets.length; i++) {
            if (brackets[i].tagName != 'FORM') {
                continue;
            }
            const players = [...brackets[i]];
            for (let j = 0; j < players.length; j++) {
                if (players[j].defaultValue === `(Winner of ${matchup})`) {
                    players[j].value = name;
                    if (j % 2 == 0) {
                        players[j].nextSibling.innerHTML = players[j].nextSibling.innerHTML.replace(`(Winner of ${matchup})`, name);
                    }
                    else {
                        players[j].previousSibling.innerHTML = players[j].previousSibling.innerHTML.replace(`(Winner of ${matchup})`, name);
                    }
                }
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
        for (let i = 0; i < oldPairs.length; i++) {
            for (let j = 0; j < oldPairs[i].length; j++) {
                if (oldPairs[i][j] === `(Winner of ${matchup})`) {
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
    else if (!e.checked && oppElem.checked) {
        const brackets = [...document.getElementById('chooseWinners').children];
        for (let i = 0; i < brackets.length; i++) {
            if (brackets[i].tagName != 'FORM') {
                continue;
            }
            const players = [...brackets[i]];
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
                    if (j % 2 == 0) {
                        players[j].nextSibling.innerHTML = players[j].nextSibling.innerHTML.replace(`(Loser of ${matchup})`, name);
                    }
                    else {
                        players[j].previousSibling.innerHTML = players[j].previousSibling.innerHTML.replace(`(Loser of ${matchup})`, name);
                    }
                }
            }
        }
        for (let i = 0; i < oldPairs.length; i++) {
            for (let j = 0; j < oldPairs[i].length; j++) {
                if (oldPairs[i][j] === `(Winner of ${matchup})`) {
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
    else {
        const brackets = [...document.getElementById('chooseWinners').children];
        for (let i = 0; i < brackets.length; i++) {
            if (brackets[i].tagName != 'FORM') {
                continue;
            }
            const players = [...brackets[i]];
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
        for (let i = 0; i < oldPairsOrig.length; i++) {
            for (let j = 0; j < oldPairsOrig[i].length; j++) {
                if (oldPairsOrig[i][j] === `(Winner of ${matchup})`) {
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
function finalRound() {
    const finalBtn = document.getElementById('advance');
    finalBtn.setAttribute('onclick', 'calcFinalScore();');
    finalBtn.onclick = function () { calcFinalScore(); };
    finalBtn.innerHTML = 'Calc Final Scores';
}
function findWLIndices(arr) {
    const indices = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].includes('(Winner of') || arr[i].includes('(Loser of') || arr[i] === 'BYE') {
            indices.push(i);
        }
    }
    return indices;
}
function parseBM() {
    const providedNames = document.getElementById('inputBox').value.split(/[\r\n]+/);
    const participants = [];
    for (let i = 0; i < providedNames.length; i++) {
        const parsedMatchup = providedNames[i].match(/@(\S+.+) \u202Fvs\u202F @(\S+.+)/g);
        if (parsedMatchup === null) {
            alert('Unable to parse output from Bracket Maker.');
            break;
        }
        participants.push(parsedMatchup[1]);
        participants.push(parsedMatchup[2]);
    }
    return participants;
}
function postResults(arr, id) {
    const arrOut = [];
    if (id == 'results') {
        let bracketStrOut = '';
        let bracketStrOutOld = '';
        for (let i = 0; i < arr.length; i++) {
            const parentDiv = document.getElementById(arr[i]);
            bracketStrOutOld = bracketStrOut;
            bracketStrOut = parentDiv.dataset.bracket;
            if (bracketStrOut != bracketStrOutOld) {
                arrOut.push('<br />' + bracketStrOut + '<br />');
            }
            const matchup = parentDiv.children;
            const pElem1 = matchup[0];
            const pElem2 = matchup[2];
            if (pElem1.checked && pElem2.value != 'BYE') {
                const strOut = `[b]@${pElem1.value}[/b] VS @${pElem2.value}`;
                arrOut.push(strOut);
            }
            else if (pElem1.checked && pElem2.value == 'BYE') {
                const strOut = `[b]@${pElem1.value}[/b] VS ${pElem2.value}`;
                arrOut.push(strOut);
            }
            else {
                const strOut = `@${pElem1.value} VS [b]@${pElem2.value}[/b]`;
                arrOut.push(strOut);
            }
        }
    }
    else {
        arr.forEach(matchup => {
            const strOut = `@${matchup[0]} VS @${matchup[1]}`;
            arrOut.push(strOut);
        });
    }
    document.getElementById(id).innerHTML = arrOut.join('<br />');
}
function postStandings(obj, ext) {
    let finalResults = Object.entries(obj);
    const allExtNames = [];
    for (let i = 0; i < ext.length; i++) {
        allExtNames.push(...ext[i]);
    }
    finalResults = finalResults.sort(function (a, b) {
        return (b[1][0] - b[1][1]) - (a[1][0] - a[1][1]);
    });
    const arrOut = [];
    for (let i = 0; i < finalResults.length; i++) {
        if (finalResults[i][0] == 'BYE') {
            continue;
        }
        if (allExtNames.includes(finalResults[i][0])) {
            const strOut = `@${finalResults[i][0]}: ${finalResults[i][1].join(',')} (Pending)`;
            arrOut.push(strOut);
        }
        else {
            const strOut = `@${finalResults[i][0]}: ${finalResults[i][1].join(',')}`;
            arrOut.push(strOut);
        }
    }
    document.getElementById('standings').innerHTML = arrOut.join('<br />');
}
function removeUser() {
    const userField = document.getElementById('removeUserField');
    const user = userField.value;
    if (user == '') {
        alert('You must enter a username.');
        return;
    }
    const curBracket = sessionStorage.getItem('currentBracket') || '';
    if (curBracket == '') {
        alert('You must load or make a bracket first!');
        return;
    }
    const bracketObj = localStorage.getItem(curBracket);
    if (!bracketObj) {
        alert('Desired bracket not found.');
        return;
    }
    const bracket = JSON.parse(bracketObj);
    const participants = bracket.participants || [];
    if (participants.includes(user)) {
        const index = participants.indexOf(user);
        bracket.participants.splice(index, 1);
        alert('User removed');
        userField.value = '';
    }
    else {
        alert('User not found in this bracket!');
        userField.value = '';
        return;
    }
    const quitList = bracket['quits'] || [];
    const quitStandings = bracket['quitStandings'] || {};
    quitList.push(user);
    if (bracket.standings) {
        quitStandings[user] = bracket.standings[user];
        delete bracket.standings[user];
    }
    bracket['quits'] = quitList;
    bracket['quitStandings'] = quitStandings;
    localStorage.setItem(curBracket, JSON.stringify(bracket));
}
function subUser() {
    const userField1 = document.getElementById('subUserField1');
    const userField2 = document.getElementById('subUserField2');
    const user1 = userField1.value;
    const user2 = userField2.value;
    if (user1 == '' || user2 == '') {
        alert('You must enter a username.');
        return;
    }
    if (user1 == user2) {
        return;
    }
    const curBracket = sessionStorage.getItem('currentBracket') || '';
    if (curBracket == '') {
        alert('You must load or make a bracket first!');
        return;
    }
    const bracketObj = localStorage.getItem(curBracket);
    if (!bracketObj) {
        alert('Desired bracket not found.');
        return;
    }
    const bracket = JSON.parse(bracketObj);
    const participants = bracket.participants || [];
    if (participants.includes(user1)) {
        const index = participants.indexOf(user1);
        bracket.participants.splice(index, 1, user2);
    }
    else {
        alert('User not found in this bracket!');
        userField1.value = '';
        return;
    }

    // update the standings
    if (user1 !== user2 && bracket.standings) {
        Object.defineProperty(bracket.standings, user2,
            Object.getOwnPropertyDescriptor(bracket.standings, user1));
        delete bracket.standings[user1];
    }
    if (bracket.pairs) {
        for (let i = 0; i < bracket.pairs.length; i++) {
            for (let j = 0; j < bracket.pairs[i].length; j++) {
                if (bracket.pairs[i][j] == user1) {
                    bracket.pairs[i][j] = user2;
                }
            }
        }
    }
    if (bracket.DOM) {
        bracket.DOM = bracket.DOM.replaceAll(user1, user2);
    }
    userField1.value = '';
    userField2.value = '';
    alert('User subbed! Please reload the bracket to take effect');
    localStorage.setItem(curBracket, JSON.stringify(bracket));
}
function initBracket() {
    let providedNames;
    resetWinners();
    const BMFlag = document.getElementById('parseBracketMakerOption').checked;
    if (BMFlag) {
        providedNames = parseBM();
    }
    else {
        providedNames = document.getElementById('inputBox').value.split(/[\r\n]+/);
    }
    if (providedNames.length === 1 && providedNames[0] == '') {
        alert(`Please enter the names of the participants.`);
        return;
    }
    if (providedNames.length < 4) {
        alert(`Tournaments require at least 4 participants! You currently have ${providedNames.length}.`);
        return;
    }
    providedNames = providedNames.filter(user => user);
    const dupFound = hasDuplicates(providedNames);
    if (dupFound) {
        const dupes = findDuplicates(providedNames);
        alert(`Duplicate entries found: ${dupes.join(', ')}`);
        return;
    }
    const curBracket = sessionStorage.getItem('currentBracket');
    const bracket = JSON.parse(localStorage.getItem(curBracket));
    const theoreticalRounds = Math.floor(providedNames.length / 2);
    if (theoreticalRounds < bracket.roundsRemaining) {
        alert(`Warning: Desired number of rounds is greater than the theoretical max for this number of participants: ${theoreticalRounds}. Please make a new bracket with no more than ${theoreticalRounds} round(s).`);
        return;
    }
    bracket.roundsRemaining = bracket.roundsRemaining - 1;
    document.getElementById('rounds').innerHTML = bracket.roundsRemaining.toString();
    bracket['participants'] = providedNames;
    if (bracket.roundsRemaining == 0) {
        finalRound();
    }
    localStorage.setItem(curBracket, JSON.stringify(bracket));
    makeBracket();
}
function makeBracket(group, ext, makeExtBracket, pairDownUser, finalIter, ratio) {
    document.getElementById('makeBracketBtn').style.display = 'none';
    const advanceInputs = [...document.getElementsByClassName('advance-inputs')];
    for (const i of advanceInputs) {
        i.style.display = 'block ruby';
    }
    const curBracket = sessionStorage.getItem('currentBracket');
    const bracket = JSON.parse(localStorage.getItem(curBracket));
    const providedNames = bracket['participants'];
    const oldPairings = bracket['pairs'] || [];
    const pairDown = document.getElementById('pair-down').checked;
    let unpaired = '';
    let userlist;
    if (makeExtBracket) {
        userlist = ext;
    }
    else if (group && !makeExtBracket) {
        if (pairDownUser) {
            group.push(pairDownUser);
        }
        userlist = group;
    }
    else {
        userlist = JSON.parse(JSON.stringify(providedNames));
    }
    if (userlist.length !== 2) {
        userlist = shuffle(userlist);
    }
    else {
        userlist = [userlist[1], userlist[0]];
    }
    let userlistCopy = JSON.parse(JSON.stringify(userlist));
    let pairings = [];
    let name1 = '', name2 = '';
    let validPairs = false;
    let retries = 500;
    while (!validPairs) {
        pairings = [];
        const origUserlistLen = userlist.length;
        while (userlistCopy.length) {
            name1 = userlistCopy.pop();
            if (userlistCopy.length == 0 && !pairDown) {
                name2 = 'BYE';
            }
            else if (userlistCopy.length === 0 && finalIter) {
                name2 = 'BYE';
            }
            else if (userlistCopy.length === 0) {
                unpaired = name1;
                name2 = '-pair-down-user';
            }
            else {
                name2 = userlistCopy.pop();
            }
            const tempPair = [name1, name2];
            let isOldPair = false;
            if (!makeExtBracket) {
                isOldPair = oldPairings.some(arr => {
                    const sameTest = arr.every(function (element) {
                        return element === tempPair[0] || element === tempPair[1] && tempPair[0] !== tempPair[1];
                    });
                    return arr.length == tempPair.length && sameTest;
                });
            }
            if (isOldPair && origUserlistLen == 2) {
                alert('No possible pairings left!');
                return;
            }
            if (isOldPair) {
                break;
            }
            if (name2 !== '-pair-down-user') {
                pairings.push([name1, name2]);
            }
            if (!userlistCopy.length) {
                validPairs = true;
            }
        }
        if (!validPairs) {
            userlistCopy = JSON.parse(JSON.stringify(shuffle(userlist)));
        }
        retries--;
        if (retries < 0) {
            alert('Max number of tries exceeded. Unable to create pairings that do not duplicate.');
            const standings = bracket.standings;
            postStandings(standings, []);
            const pairs = ['Old pairs', '', ...bracket.pairs];
            document.getElementById('results').innerHTML = pairs.join('<br />');
            return;
        }
    }
    const pairTextArr = [];
    const pairingsCopy = JSON.parse(JSON.stringify(pairings));
    for (let i = 0; i < pairingsCopy.length; i++) {
        const winLossIndex = findWLIndices(pairingsCopy[i]);
        if (winLossIndex.length && !makeExtBracket && ext) {
            for (let j = 0; j < pairingsCopy[i].length; j++) {
                for (let k = 0; k < ext.length; k++) {
                    if (pairingsCopy[i][j].includes(ext[k])) {
                        pairingsCopy[i][j] = pairingsCopy[i][j].replace(ext[k], `@${ext[k]}`);
                    }
                }
            }
            if (winLossIndex.length === 1) {
                if (winLossIndex[0] == 0) {
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
        else if (winLossIndex.length) {
            if (winLossIndex.length === 1) {
                if (winLossIndex[0] == 0) {
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
        else {
            const pairText = `@${pairings[i][0]} VS @${pairings[i][1]}`;
            pairTextArr.push(pairText);
        }
    }
    let headerOut = [''];
    if (makeExtBracket != true) {
        headerOut = ['<br />[0,0] Bracket<br />'];
    }
    for (let i = 0; i < pairings.length; i++) {
        if (bracket.standings && makeExtBracket == false) {
            headerOut = ['<br />[' + ratio + '] Bracket<br />'];
        }
    }
    let output;
    if (makeExtBracket) {
        output = document.getElementById('output-ext');
    }
    else {
        output = document.getElementById('output-bracket');
    }
    const textDiv = document.createElement('div');
    if (makeExtBracket) {
        textDiv.innerHTML = pairTextArr.join('<br />');
        textDiv.innerHTML = pairTextArr.join('<br />');
    }
    else {
        textDiv.innerHTML = headerOut.concat(pairTextArr).join('<br />');
    }
    output.appendChild(textDiv);
    bracket['pairs'] = bracket['pairs'] || [];
    if (!makeExtBracket) {
        bracket['pairs'] = bracket['pairs'].concat(pairings);
    }
    localStorage.setItem(curBracket, JSON.stringify(bracket));
    sessionStorage.setItem('pairs', JSON.stringify(bracket['pairs']));
    createWinnerForm(pairings, ext, makeExtBracket, curBracket, bracket, ratio ?? '');
    return unpaired;
}
function createWinnerForm(pairs, ext, makeExtBracket, curBracket, bracket, ratio) {
    let parentDiv, divID;
    if (makeExtBracket) {
        parentDiv = document.getElementById('extensions');
        divID = 'ext';
    }
    else {
        parentDiv = document.getElementById('chooseWinners');
        divID = '';
    }
    const child = parentDiv.children;
    let childCount = 0;
    for (const element of child) {
        if (element.tagName == 'FORM') {
            childCount++;
        }
    }
    let grandChildCount = 0;
    for (let i = 0; i < child.length; i++) {
        grandChildCount += child[i].childElementCount;
    }
    const form = document.createElement('form');
    form.setAttribute('id', `${divID}winnerForm${childCount + 1}`);
    const label = document.createElement('label');
    if (makeExtBracket == false) {
        label.setAttribute('for', `${divID}winnerForm${childCount + 1}`);
        label.style.cssText = 'margin: 20px 0px; display: inline-block;';
        parentDiv.appendChild(label);
    }
    for (let i = 0; i < pairs.length; i++) {
        const div = document.createElement('div');
        div.setAttribute('id', `${divID}pair${i + grandChildCount}`);
        const box1 = document.createElement("input");
        box1.setAttribute('type', 'checkbox');
        box1.setAttribute('value', pairs[i][0]);
        box1.setAttribute('data-default', pairs[i][0]);
        if (makeExtBracket == true) {
            div.setAttribute('data-bracket', 'Extension');
        }
        else {
            div.setAttribute('data-bracket', '[0,0] Bracket');
        }
        if (bracket.standings && makeExtBracket == false) {
            label.innerHTML = '[' + ratio + '] Bracket';
            div.setAttribute('data-bracket', label.innerHTML);
        }
        const box2 = document.createElement("input");
        box2.setAttribute('type', 'checkbox');
        box2.setAttribute('value', pairs[i][1]);
        box2.setAttribute('data-default', pairs[i][1]);
        if (box1.value === 'BYE') {
            box1.disabled = true;
            box2.required = true;
        }
        else if (box2.value === 'BYE') {
            box2.disabled = true;
            box1.required = true;
        }
        if (makeExtBracket) {
            box1.addEventListener('change', function () { extWinnerChosen(this); storeChecked(this); });
            box2.addEventListener('change', function () { extWinnerChosen(this); storeChecked(this); });
        }
        else {
            box1.addEventListener('change', function () { storeChecked(this); });
            box2.addEventListener('change', function () { storeChecked(this); });
        }
        const pairText = document.createElement('span');
        pairText.innerHTML = `${box1.value} VS ${box2.value}`;
        pairText.setAttribute('data-default', `${box1.value} VS ${box2.value}`);
        div.appendChild(box1);
        div.appendChild(pairText);
        div.appendChild(box2);
        if (makeExtBracket) {
            const dlBox = document.createElement('input');
            dlBox.setAttribute('type', 'checkbox');
            dlBox.classList.add('double-loss');
            dlBox.setAttribute('value', 'Double loss');
            dlBox.setAttribute('id', `${divID}winnerForm${childCount + 1}DoubleLoss`);
            const label = document.createElement('label');
            label.setAttribute('for', `${divID}winnerForm${childCount + 1}DoubleLoss`);
            label.textContent = 'Grant double loss';
            div.appendChild(dlBox);
            div.appendChild(label);
        }
        form.appendChild(div);
    }
    parentDiv.appendChild(form);
    const curDOM = document.getElementById('pageContent').innerHTML;
    bracket['DOM'] = curDOM;
    localStorage.setItem(curBracket, JSON.stringify(bracket));
}
function advanceRound() {
    const curBracket = sessionStorage.getItem('currentBracket');
    const bracket = JSON.parse(localStorage.getItem(curBracket));
    const winners = [...document.querySelectorAll("input[type=checkbox]:not(#parseBracketMakerOption,#player1Check,#player2Check,#pair-down):checked")];
    const losers = [...document.querySelectorAll('input[type=checkbox]:not(#parseBracketMakerOption,#player1Check,#player2Check,#pair-down):not(:checked)')];
    const extBracketChildNodeCount = document.getElementById('extensions').childNodes.length;
    const extWinners = [...document.querySelectorAll("#extensions :checked")];
    if (extWinners.length < extBracketChildNodeCount) {
        alert('The winner of the extension must be decided!');
        return;
    }
    const parentNodesW = [];
    const parentNodesL = [];
    const winnerNames = [];
    const loserNames = [];
    let extension = [];
    const extNames = [];
    winners.forEach(e => {
        parentNodesW.push(e.parentNode.id);
        winnerNames.push(e.value);
    });
    losers.forEach(e => {
        parentNodesL.push(e.parentNode.id);
        loserNames.push(e.value);
    });
    const dupFoundW = hasDuplicates(parentNodesW);
    if (dupFoundW) {
        alert('You cannot have two winners in a matchup!');
        return;
    }
    const dupFoundL = hasDuplicates(parentNodesL);
    if (dupFoundL) {
        extension = findDuplicates(parentNodesL);
    }
    extension.forEach(e => {
        const extIndex = parentNodesL.indexOf(e);
        extNames.push(loserNames.slice(extIndex, extIndex + 2));
        loserNames.splice(extIndex, 2);
        parentNodesL.splice(extIndex, 2);
    });
    if (extNames.some(name => name.includes('BYE'))) {
        alert('You cannot extend a BYE');
        return;
    }
    if (parentNodesW.length) {
        postResults(parentNodesW, 'results');
    }
    if (extNames.length) {
        postResults(extNames, 'results-ext');
    }
    bracket['pairs'] = JSON.parse(sessionStorage.getItem('pairs'));
    bracket['roundsRemaining']--;
    document.getElementById('rounds').innerHTML = bracket.roundsRemaining.toString();
    localStorage.setItem(curBracket, JSON.stringify(bracket));
    if (bracket['roundsRemaining'] == 0) {
        finalRound();
    }
    updateWL(winnerNames, loserNames, extNames, curBracket, bracket);
}
function updateWL(winnerNames, loserNames, extNames, curBracket, bracket) {
    let userlist = bracket['participants'];
    let standings = bracket['standings'];
    if (standings == null) {
        standings = {};
    }
    else {
        standings = standings;
        userlist = winnerNames.concat(loserNames);
    }
    if (bracket.quits) {
        bracket.quits.forEach(name => {
            if (userlist.includes(name)) {
                for (let i = 0; i < userlist.length; i++) {
                    if (userlist[i] == name) {
                        userlist.splice(i, 1);
                    }
                }
            }
            for (let i = 0; i < extNames.length; i++) {
                if (extNames[0][0] == name) {
                    extNames[0][0] = 'BYE';
                }
                else if (extNames[1][1] == name) {
                    extNames[1][1] = 'BYE';
                }
            }
        });
    }
    for (const username of userlist) {
        if (winnerNames.includes(username) && username != 'BYE') {
            const index = winnerNames.indexOf(username);
            winnerNames.splice(index, 1);
            standings[username] = [(standings[username]?.[0] || 0) + 1, standings[username]?.[1] || 0];
        }
        else if (loserNames.includes(username) && username != 'BYE') {
            const index = loserNames.indexOf(username);
            loserNames.splice(index, 1);
            standings[username] = [(standings[username]?.[0] || 0), (standings[username]?.[1] || 0) + 1];
        }
        else if (username != 'BYE') {
            standings[username] = [(standings[username]?.[0] || 0), standings[username]?.[1] || 0];
        }
    }
    bracket['standings'] = standings;
    postStandings(standings, extNames);
    localStorage.setItem(curBracket, JSON.stringify(bracket));
    newPairs(standings, extNames);
}
function newPairs(standings, extNames) {
    const allExtNames = [];
    for (let i = 0; i < extNames.length; i++) {
        const tempWinner = extNames[i][0];
        const tempLoser = extNames[i][1];
        standings[tempWinner][0]++;
        standings[tempLoser][1]++;
        allExtNames.push(...extNames[i]);
    }
    const ratios = Object.values(standings);
    const names = Object.keys(standings);
    const seen = new Set();
    const uniq = ratios.filter(subArray => {
        const key = JSON.stringify(subArray);
        if (seen.has(key)) {
            return false;
        }
        else {
            seen.add(key);
            return true;
        }
    });
    uniq.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
    const groups = {};
    for (let i = 0; i < uniq.length; i++) {
        const array1 = uniq[i];
        const indices = [];
        for (let j = 0; j < ratios.length; j++) {
            const array2 = ratios[j];
            const is_same = array1.length == array2.length && array1.every(function (element, index) {
                return element === array2[index];
            });
            const name = names[j];
            if (is_same && !allExtNames.includes(name)) {
                indices.push(name);
            }
            else if (is_same && allExtNames.includes(name)) {
                const pairIndex = extNames.findIndex(extCombo => extCombo.some(ext => ext === name));
                if (name == extNames[pairIndex][0]) {
                    indices.push(`(Winner of ${extNames[pairIndex][0]} VS ${extNames[pairIndex][1]})`);
                }
                else {
                    indices.push(`(Loser of ${extNames[pairIndex][0]} VS ${extNames[pairIndex][1]})`);
                }
            }
        }
        groups[uniq[i].join(',')] = indices;
    }
    resetWinners();
    if (extNames.length) {
        for (let i = 0; i < extNames.length; i++) {
            makeBracket(undefined, extNames[i], true);
        }
    }
    let unpairedUser = '';
    const totalGroups = Object.keys(groups).length;
    let i = 0;
    for (const [record, group] of Object.entries(groups)) {
        if (i === totalGroups - 1) {
            unpairedUser = makeBracket(group, allExtNames, false, unpairedUser, true, record) ?? '';
        }
        else {
            unpairedUser = makeBracket(group, allExtNames, false, unpairedUser, false, record) ?? '';
        }
        i++;
    }
}
function calcFinalScore() {
    const winners = [...document.querySelectorAll("input[type=checkbox]:not(#parseBracketMakerOption,#player1Check,#player2Check,#pair-down):checked")];
    const losers = [...document.querySelectorAll('input[type=checkbox]:not(#parseBracketMakerOption,#player1Check,#player2Check,#pair-down):not(:checked)')];
    const parentNodesW = [];
    const parentNodesL = [];
    const winnerNames = [];
    const loserNames = [];
    winners.forEach(e => {
        parentNodesW.push(e.parentNode.id);
        winnerNames.push(e.value);
    });
    losers.forEach(e => {
        parentNodesL.push(e.parentNode.id);
        loserNames.push(e.value);
    });
    const dupFoundW = hasDuplicates(parentNodesW);
    if (dupFoundW) {
        alert('You cannot have two winners in a matchup!');
        return;
    }
    const dupFoundL = hasDuplicates(parentNodesL);
    if (dupFoundL) {
        alert('You must have a winner in each matchup!');
        return;
    }
    if (parentNodesW.length) {
        postResults(parentNodesW, 'results');
    }
    const advanceInputs = [...document.getElementsByClassName('advance-inputs')];
    for (const i of advanceInputs) {
        i.style.display = 'none';
    }
    document.getElementById('standings').innerHTML = '';
    const userlist = winnerNames.concat(loserNames);
    const curBracket = sessionStorage.getItem('currentBracket');
    const bracket = JSON.parse(localStorage.getItem(curBracket));
    const standings = bracket['standings'] || {};
    for (const username of userlist) {
        if (winnerNames.includes(username)) {
            const index = winnerNames.indexOf(username);
            winnerNames.splice(index, 1);
            standings[username] = [(standings[username]?.[0] || 0) + 1, standings[username]?.[1] || 0];
        }
        else if (loserNames.includes(username)) {
            const index = loserNames.indexOf(username);
            loserNames.splice(index, 1);
            standings[username] = [(standings[username]?.[0] || 0), (standings[username]?.[1] || 0) + 1];
        }
    }
    bracket['standings'] = standings;
    bracket['pairs'] = JSON.parse(sessionStorage.getItem('pairs'));
    localStorage.setItem(curBracket, JSON.stringify(bracket));
    let finalResults = Object.entries(standings);
    finalResults = finalResults.sort(function (a, b) {
        return (b[1][0] - b[1][1]) - (a[1][0] - a[1][1]);
    });
    const modFinalResults = calcResist(finalResults, bracket);
    const strOut = ['Format is:  Win,Loss (Avg Opp Win % | Avg Opp Opp Win %)<br />'];
    for (let i = 0; i < modFinalResults.length; i++) {
        if (modFinalResults[i][0] == 'BYE') {
            continue;
        }
        const str = `@${modFinalResults[i][0]}: ${modFinalResults[i][1].join(',')} (${modFinalResults[i][2]}% | ${modFinalResults[i][3]}%)`;
        strOut.push(str);
    }
    document.getElementById('current-output').innerHTML = strOut.join('<br />');
    document.getElementById('current').innerHTML = 'Final Results';
    let quitFinalResults = [];
    if (bracket.quitStandings) {
        quitFinalResults = Object.entries(bracket.quitStandings);
    }
    const modQuitFinalResults = calcResist(quitFinalResults, bracket);
    const quitStrOut = [];
    if (modQuitFinalResults.length) {
        quitStrOut.push('Format is:  Win,Loss (Avg Opp Win % | Avg Opp Opp Win %)<br />');
        for (let i = 0; i < modQuitFinalResults.length; i++) {
            if (modQuitFinalResults[i][0] == 'BYE') {
                continue;
            }
            const str = `@${modQuitFinalResults[i][0]}: ${modQuitFinalResults[i][1].join(',')} (${modQuitFinalResults[i][2]}% | ${modQuitFinalResults[i][3]}%)`;
            quitStrOut.push(str);
        }
    }
    if (quitStrOut.length) {
        document.getElementById('quitResults').innerHTML = quitStrOut.join('<br />');
        document.getElementById('quitStandings').style.display = 'block';
    }
    const curDOM = document.getElementById('pageContent').innerHTML;
    bracket['DOM'] = curDOM;
    localStorage.setItem(curBracket, JSON.stringify(bracket));
}
function calcResist(finalResults, bracket) {
    const modFinalResults = [];
    for (const user of finalResults) {
        const username = user[0];
        const oppArr = getOpp(username, bracket);
        const avgOppWP = getOppWinPercent(oppArr, finalResults);
        const tempOppOppWP = [];
        for (const opp of oppArr) {
            const oppOppArr = getOpp(opp, bracket);
            const oppOppWP = getOppWinPercent(oppOppArr, finalResults);
            tempOppOppWP.push(oppOppWP);
        }
        const avgOppOppWP = (tempOppOppWP.reduce((a, b) => (Number(a) + Number(b)), 0) / (tempOppOppWP.length === 0 ? 1 : tempOppOppWP.length)).toFixed(2);
        const modUser = [...user, avgOppWP, avgOppOppWP];
        modFinalResults.push(modUser);
    }
    return modFinalResults;
}
function getOpp(username, bracket) {
    const matchArr = bracket.pairs?.filter(p => p.some(uname => uname === username)) ?? [];
    if (!matchArr.length) {
        return [];
    }
    const oppArr = matchArr.map(oppname => oppname.find(name => name !== username));
    return oppArr;
}
function getOppWinPercent(oppArr, finalResults) {
    const tempOppWP = [];
    for (const opp of oppArr) {
        if (opp === 'BYE') {
            continue;
        }
        const oppResultFind = finalResults.find(arr => arr[0] === opp);
        const oppResult = oppResultFind ? oppResultFind[1] : [0, 1];
        const winPercent = oppResult[0] / (oppResult[0] + oppResult[1]);
        tempOppWP.push(winPercent);
    }
    const avgOppW = tempOppWP.reduce((a, b) => (a + b), 0) / (tempOppWP.length === 0 ? 1 : tempOppWP.length);
    return (avgOppW * 100).toFixed(2);
}
function addMatch() {
    const userField1 = document.getElementById('player1Field');
    const userField2 = document.getElementById('player2Field');
    const userCheckbox1 = document.getElementById('player1Check');
    const userCheckbox2 = document.getElementById('player2Check');
    const user1 = userField1.value;
    const user2 = userField2.value;
    const users = [user1, user2];
    if (user1 == '' || user2 == '') {
        alert('You must enter a username.');
        return;
    }
    if (user1 == user2) {
        alert('Users cannot play themselves, unless you\'re DJ Khaled!');
        return;
    }
    if ((userCheckbox1.checked && userCheckbox2.checked) || (!userCheckbox1.checked && !userCheckbox2.checked)) {
        alert('You must select 1 winner');
        return;
    }
    const curBracket = sessionStorage.getItem('currentBracket') || '';
    if (curBracket == '') {
        alert('You must load or make a bracket first!');
        return;
    }
    const bracketObj = localStorage.getItem(curBracket);
    if (!bracketObj) {
        alert('Desired bracket not found.');
        return;
    }
    const bracket = JSON.parse(bracketObj);
    const participants = bracket.participants || [];
    for (const user of users) {
        if (!participants.includes(user)) {
            participants.push(user);
        }
        else {
            continue;
        }
    }
    bracket.participants = participants;
    const standings = bracket.standings || {};
    let idx = 0;
    for (const user of users) {
        if (idx === 0) {
            if (userCheckbox1.checked) {
                standings[user] = [standings[user][0] + 1 || 1, standings[user][1] || 0];
            }
            else {
                standings[user] = [standings[user][0] || 0, standings[user][1] + 1 || 1];
            }
        }
        else {
            if (userCheckbox2.checked) {
                standings[user] = [standings[user][0] + 1 || 1, standings[user][1] || 0];
            }
            else {
                standings[user] = [standings[user][0] || 0, standings[user][1] + 1 || 1];
            }
        }
        idx++;
    }
    bracket.standings = standings;
    if (bracket.pairs) {
        bracket.pairs.push(users);
    }
    else {
        bracket.pairs = [users];
    }
    userField1.value = '';
    userField2.value = '';
    userCheckbox1.checked = false;
    userCheckbox2.checked = false;
    alert('Game results added!');
    localStorage.setItem(curBracket, JSON.stringify(bracket));
    sessionStorage.setItem('pairs', JSON.stringify(bracket['pairs']));
}

