
const lastStyleHead = localStorage.getItem('skin') ?? '';
document.getElementById('stylesheet').href = lastStyleHead.length ? `/assets/css/${lastStyleHead}` : '/assets/css/style.css';



// delete the 1, 2, 3... row counters
const rowCounters = document.querySelectorAll('.row-headers-background');
for (const counters of rowCounters) {
    counters.parentNode.removeChild(counters);
}

// delete the A, B, C... column counters
const colCounters = document.querySelectorAll('.column-headers-background');
for (const counters of colCounters) {
    counters.parentNode.removeChild(counters);
}

const freezeExtraRow = document.getElementsByClassName('freezebar-vertical-handle');
for (const row of freezeExtraRow) {
    row.parentNode.removeChild(row);
}


// assign a proper table header using the first row of data instead of the abc
const headerRow = document.getElementsByTagName('thead');
const tableBody = document.getElementsByTagName('tbody');

headerRow[0].innerHTML = tableBody[0].children[0].innerHTML.replace(/td/gm, 'th');
tableBody[0].removeChild(tableBody[0].children[0]);
tableBody[0].removeChild(tableBody[0].children[0]);

let softMerges = document.getElementsByClassName('softmerge-inner');
for (const softMerge of softMerges) {
    softMerge.style = '';
}