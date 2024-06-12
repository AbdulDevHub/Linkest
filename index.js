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

// ============ Save Tab ============
tabBtn.addEventListener("click", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let index = parseInt(inputEl.value) - 1

    // If inputEl does not contain a valid number, or the index is out of bounds, save the URL at the first index
    if (isNaN(index) || index < 0 || index > myLeads.length)
      myLeads.unshift(tabs[0].url)
    // If inputEl contains a valid number, save the URL at that index
    else myLeads.splice(index, 0, tabs[0].url)

    localStorage.setItem("myLeads", JSON.stringify(myLeads))
    render(myLeads)
  })
})

// ============ Save Input ============
inputEl.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    inputBtn.click()
  }
})

inputBtn.addEventListener("click", function () {
  let inputValue = inputEl.value
  let dotIndex = inputValue.indexOf(". ")
  let index = parseInt(inputValue.substring(0, dotIndex)) - 1
  let text = inputValue.substring(dotIndex + 2)

  // Check if the input starts with "#. "
  if (!isNaN(index) && text) {
    // If the index is within the array bounds, insert the new item at that position
    if (index >= 0 && index <= myLeads.length) myLeads.splice(index, 0, text)
    else myLeads.push(text) // Add the new item at the end

    // If the input does not start with "#. ", add the new item at the beginning
  } else myLeads.unshift(inputValue)

  inputEl.value = ""
  localStorage.setItem("myLeads", JSON.stringify(myLeads))
  render(myLeads)
})

// ============ Delete ============
window.addEventListener("keydown", function (event) {
  if (
    (inputEl.value.match(/^(?=.*\d)[0-9\s-]*$/) || inputEl.value === "") &&
    event.key === "Delete"
  ) {
    deleteBtn.click()
  }
})

deleteBtn.addEventListener("click", function () {
  let inputValue = inputEl.value
  let deletedValues = []

  // Multiple Index Deletion: Only if inputValue contains #, spaces, or '-'
  // and at least one number. Ex: "1 3 5-8 10 2"
  if (inputValue.match(/^(?=.*\d)[0-9\s-]*$/)) {
    let indices = inputValue.split(/\s+/) // Split input by one or more spaces

    // Convert any present ranges to indices
    let finalIndices = []
    for (let i = 0; i < indices.length; i++) {
      let index = indices[i]
      if (index.includes("-")) {
        // Split the range into start and end
        let range = index.split("-")
        let start = parseInt(range[0])
        let end = parseInt(range[1])

        // Convert the range to individual indices and add them to the finalIndices array
        for (let j = start; j <= end; j++) {
          if (!finalIndices.includes(j)) finalIndices.push(j)
        }
      } else {
        // If it's not a range, just add it to finalIndices
        let idx = parseInt(index)
        if (!finalIndices.includes(idx)) finalIndices.push(idx)
      }
    }

    // Sort the finalIndices array from biggest to smallest
    finalIndices.sort((a, b) => b - a)

    // Delete the indices in the finalIndices array
    for (let i = 0; i < finalIndices.length; i++) {
      let idx = finalIndices[i]
      // If index out of range, alert user
      if (idx < 1 || idx > myLeads.length) {
        alert("Invalid index: " + idx)
        continue
      }
      // Delete link and add it to deletedValues array along with its index #
      deletedValues.push(`${idx}. ${myLeads.splice(idx - 1, 1)[0]}`)
    }

    // Set input to deleted values separated by " + "
    inputEl.value = deletedValues.join(" + ")
  }

  // Even if input not empty, delete first item in list and put it in input
  else inputEl.value = `1. ${myLeads.splice(0, 1)[0]}`

  localStorage.setItem("myLeads", JSON.stringify(myLeads))
  render(myLeads)
})

// ============ Delete All ============
deleteAllBtn.addEventListener("dblclick", function () {
  inputEl.value = myLeads.join(" + ")
  localStorage.clear()
  myLeads = []
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
