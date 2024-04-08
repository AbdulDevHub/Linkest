let myLeads = []
const inputEl = document.getElementById("input-el")
const inputBtn = document.getElementById("input-btn")
const ulEl = document.getElementById("ul-el")
const deleteAllBtn = document.getElementById("delete-all-btn")
const deleteBtn = document.getElementById("delete-btn")
const leadsFromLocalStorage = JSON.parse(localStorage.getItem("myLeads"))
const tabBtn = document.getElementById("tab-btn")
const openFileBtn = document.getElementById("open-file-btn")
const fileInput = document.getElementById("file-input")

// ============ Access Saved Bookmarks ============
if (leadsFromLocalStorage) {
  myLeads = leadsFromLocalStorage
  render(myLeads)
}

// ============ Save Tab ============
tabBtn.addEventListener("click", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    myLeads.unshift(tabs[0].url)
    localStorage.setItem("myLeads", JSON.stringify(myLeads))
    render(myLeads)
  })
})

// ============ Render Bookmarks ============
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

// ============ Delete ============
deleteBtn.addEventListener("click", function () {
  let inputValue = inputEl.value
  let deletedValues = []
  if (inputValue) {
    // Split the input value by comma to get the indices
    let indices = inputValue.split(",")
    for (let i = 0; i < indices.length; i++) {
      let index = indices[i]
      // If the index includes a dash, it's a range
      if (index.includes("-")) {
        // Split the range into start and end
        let range = index.split("-")
        let start = parseInt(range[0])
        let end = parseInt(range[1])
        // If the start or end is not a number, or out of range, alert the user
        if (isNaN(start) || isNaN(end) || start < 1 || end > myLeads.length) {
          alert("Invalid range: " + index)
          continue
        }
        // Delete each link in the range and add them to the deletedValues array
        deletedValues.push(...myLeads.splice(start - 1, end - start + 1))
      } else {
        let idx = parseInt(index)
        // If the index is not a number, or out of range, alert the user
        if (isNaN(idx) || idx < 1 || idx > myLeads.length) {
          alert("Invalid index: " + index)
          continue
        }
        // Delete the link at the index and add it to the deletedValues array
        deletedValues.push(myLeads.splice(idx - 1, 1)[0])
      }
    }
    // Set the input value to the deleted values, separated by " + "
    inputEl.value = deletedValues.join(" + ")
  } else {
    // If the input is empty, delete the first item in the list and put it in the input
    inputEl.value = myLeads.splice(0, 1)[0]
  }
  localStorage.setItem("myLeads", JSON.stringify(myLeads))
  render(myLeads)
})

// ============ Delete All ============
deleteAllBtn.addEventListener("dblclick", function () {
  localStorage.clear()
  myLeads = []
  render(myLeads)
})

// ============ Save Input ============
inputEl.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    inputBtn.click()
  }
})

inputBtn.addEventListener("click", function () {
  let inputValue = inputEl.value
  let splitInput = inputValue.split(". ")
  let index = parseInt(splitInput[0]) - 1
  let text = splitInput[1]

  // Check if the input starts with "number. "
  if (!isNaN(index) && text) {
    // If the index is within the array bounds, insert the new item at that position
    if (index >= 0 && index <= myLeads.length) {
      myLeads.splice(index, 0, text)
    } else if (index < 0) {
      // If the index is negative, add the new item at the beginning
      myLeads.unshift(text)
    } else {
      // If the index is too large, add the new item at the end
      myLeads.push(text)
    }
  } else {
    // If the input does not start with "number. ", add the new item at the beginning
    myLeads.unshift(inputValue)
  }

  inputEl.value = ""
  localStorage.setItem("myLeads", JSON.stringify(myLeads))
  render(myLeads)
})

// ============ Open File Input or Open Links ============
openFileBtn.addEventListener("click", function () {
  let inputValue = inputEl.value
  if (inputValue) {
    // Split the input value by comma to get the indices
    let indices = inputValue.split(",")
    for (let i = 0; i < indices.length; i++) {
      let index = indices[i]
      // If the index includes a dash, it's a range
      if (index.includes("-")) {
        // Split the range into start and end
        let range = index.split("-")
        let start = parseInt(range[0])
        let end = parseInt(range[1])
        // If the start or end is not a number, or out of range, alert the user
        if (isNaN(start) || isNaN(end) || start < 1 || end > myLeads.length) {
          alert("Invalid range: " + index)
          continue
        }
        // Open each link in the range in a new tab
        for (let j = start; j <= end; j++) {
          let url = myLeads[j - 1]
          if (!/^https?:\/\//i.test(url)) {
            // If it's not a URL, make it a Google search query
            url = "https://www.google.com/search?q=" + encodeURIComponent(url)
          }
          window.open(url, "_blank")
        }
      } else {
        let idx = parseInt(index)
        // If the index is not a number, or out of range, alert the user
        if (isNaN(idx) || idx < 1 || idx > myLeads.length) {
          alert("Invalid index: " + index)
          continue
        }
        let url = myLeads[idx - 1]
        if (!/^https?:\/\//i.test(url)) {
          // If it's not a URL, make it a Google search query
          url = "https://www.google.com/search?q=" + encodeURIComponent(url)
        }
        window.open(url, "_blank")
      }
    }
  } else {
    fileInput.click()
  }
})

// ============ Handle File Selection ============
fileInput.addEventListener("change", function () {
  // Get the selected files
  let files = this.files
  // Loop through each file
  for (let i = 0; i < files.length; i++) {
    let file = files[i]
    // Create a new FileReader to read the file
    let reader = new FileReader()
    reader.onload = function (e) {
      // Create a new Blob from the file data
      let newBlob = new Blob([e.target.result], { type: file.type })
      // Create a URL for the Blob
      let url = URL.createObjectURL(newBlob)
      // Open the URL in a new tab
      chrome.tabs.create({ url: url })
    }
    reader.readAsArrayBuffer(file)
  }
})
