let myLeads = []
const inputEl = document.getElementById("input-el")
const inputBtn = document.getElementById("input-btn")
const ulEl = document.getElementById("ul-el")
const deleteAllBtn = document.getElementById("delete-all-btn")
const deleteBtn = document.getElementById("delete-btn")
const leadsFromLocalStorage = JSON.parse( localStorage.getItem("myLeads") )
const tabBtn = document.getElementById("tab-btn")
const openFileBtn = document.getElementById("open-file-btn")
const fileInput = document.getElementById("file-input")

// Access Saved Bookmarks
if (leadsFromLocalStorage) {
    myLeads = leadsFromLocalStorage
    render(myLeads)
}

// Save Tab
tabBtn.addEventListener("click", function(){    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        myLeads.unshift(tabs[0].url)
        localStorage.setItem("myLeads", JSON.stringify(myLeads) )
        render(myLeads)
    })
})

// Render Bookmarks
function render(leads) {
    let listItems = ""
    for (let i = 0; i < leads.length; i++) {
        // Check if the lead is a URL or not
        let url = leads[i]
        let className = ""
        if (!/^https?:\/\//i.test(leads[i])) {
            // If it's not a URL, make it a Google search query
            url = "https://www.google.com/search?q=" + encodeURIComponent(leads[i])
            className = "notURL"
        }
        listItems += `
            <li class='${className}'>
                <a target='_blank' href='${url}'>
                    ${leads[i]}
                </a>
            </li>
        `
    }
    ulEl.innerHTML = listItems
}

// Delete
deleteBtn.addEventListener("click", function() {
    inputEl.value = myLeads.splice((parseInt(inputEl.value)-1), 1)[0]
    localStorage.setItem("myLeads", JSON.stringify(myLeads))
    render(myLeads)
})

// Delete All
deleteAllBtn.addEventListener("dblclick", function() {
    localStorage.clear()
    myLeads = []
    render(myLeads)
})

// Save Input
// Save Input
inputBtn.addEventListener("click", function() {
    let inputValue = inputEl.value;
    let splitInput = inputValue.split(". ");
    let index = parseInt(splitInput[0]) - 1;
    let text = splitInput[1];

    // Check if the input starts with "number. "
    if (!isNaN(index) && text) {
        // If the index is within the array bounds, insert the new item at that position
        if (index >= 0 && index <= myLeads.length) {
            myLeads.splice(index, 0, text);
        } else if (index < 0) {
            // If the index is negative, add the new item at the beginning
            myLeads.unshift(text);
        } else {
            // If the index is too large, add the new item at the end
            myLeads.push(text);
        }
    } else {
        // If the input does not start with "number. ", add the new item at the beginning
        myLeads.unshift(inputValue);
    }

    inputEl.value = "";
    localStorage.setItem("myLeads", JSON.stringify(myLeads));
    render(myLeads);
})

// Open File Input
openFileBtn.addEventListener("click", function () {
    fileInput.click();
})

// Handle File Selection
fileInput.addEventListener("change", function () {
    let files = this.files;
    for(let i = 0; i < files.length; i++) {
        let file = files[i];
        let reader = new FileReader();
        reader.onload = function(e) {
            let newBlob = new Blob([e.target.result], {type: file.type});
            let url = URL.createObjectURL(newBlob);
            chrome.tabs.create({url: url});
        };
        reader.readAsArrayBuffer(file);
    }
})