let myLeads = []
let lastSelectedIndex = null

// Cache DOM elements
const elements = {
  input: document.getElementById("input-el"),
  inputBtn: document.getElementById("input-btn"),
  list: document.getElementById("ul-el"),
  deleteBtn: document.getElementById("delete-btn"),
  tabBtn: document.getElementById("tab-btn"),
  openFilesBtn: document.getElementById("open-files-btn"),
  openLinksBtn: document.getElementById("open-links-btn"),
  copyBtn: document.getElementById("copy-btn"),
  fileInput: document.getElementById("file-input")
}

// ============ Constants ============
const URL_REGEX = /^https?:\/\//i
const INDEX_INPUT_REGEX = /^(\d+)\.\s*(.+)$/
const GOOGLE_SEARCH_URL = "https://www.google.com/search?q="

// ============ Utilities ============
const storage = {
  get: () => JSON.parse(localStorage.getItem("myLeads")),
  set: (data) => localStorage.setItem("myLeads", JSON.stringify(data))
}

const isURL = (text) => URL_REGEX.test(text)

const makeURL = (text) => 
  isURL(text) ? text : GOOGLE_SEARCH_URL + encodeURIComponent(text)

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error("Clipboard copy failed", err)
  }
}

// ============ Load ============
const storedLeads = storage.get()
if (storedLeads) {
  myLeads = storedLeads
  render(myLeads)
}

// ============ Render ============
function render(leads) {
  elements.list.innerHTML = leads
    .map((lead, i) => {
      const index = i + 1
      const url = makeURL(lead)
      const className = isURL(lead) ? "" : "notURL"

      return `
        <li data-index="${index}" class="${className}">
          <button class="index-btn" data-index="${index}">${index}</button>
          <a class="lead-link" href="${url}">${lead}</a>
        </li>
      `
    })
    .join("")

  attachEventHandlers()
}

// ============ Selection Logic ============
function attachEventHandlers() {
  const buttons = elements.list.querySelectorAll(".index-btn")
  const items = elements.list.querySelectorAll("li")

  buttons.forEach((btn) => {
    btn.addEventListener("click", handleIndexButtonClick)
  })

  items.forEach((li) => {
    li.addEventListener("click", handleItemClick)
  })
}

function handleIndexButtonClick(e) {
  e.stopPropagation()

  const index = parseInt(this.dataset.index)
  const li = this.closest("li")

  if (e.shiftKey && lastSelectedIndex !== null) {
    selectRange(lastSelectedIndex, index)
  } else {
    toggleSelection(li, this)
  }

  lastSelectedIndex = index
}

async function handleItemClick(e) {
  // Ignore index button and allow Ctrl/Cmd+click to open links
  if (e.target.classList.contains("index-btn") || e.ctrlKey || e.metaKey) {
    return
  }

  e.preventDefault()

  const index = parseInt(this.dataset.index)
  const btn = this.querySelector(".index-btn")

  toggleSelection(this, btn)
  lastSelectedIndex = this.classList.contains("selected") ? index : null

  await copyToClipboard(myLeads[index - 1])
}

function toggleSelection(li, btn) {
  li.classList.toggle("selected")
  btn.classList.toggle("selected")
}

function selectRange(from, to) {
  const [start, end] = [Math.min(from, to), Math.max(from, to)]
  const items = elements.list.querySelectorAll("li")

  for (let i = start - 1; i <= end - 1; i++) {
    items[i].classList.add("selected")
    items[i].querySelector(".index-btn").classList.add("selected")
  }
}

function clearSelection() {
  elements.list
    .querySelectorAll(".selected")
    .forEach((el) => el.classList.remove("selected"))
  lastSelectedIndex = null
}

function getSelectedIndices() {
  return Array.from(elements.list.querySelectorAll("li.selected"))
    .map((li) => parseInt(li.dataset.index))
}

// ============ Ctrl/Cmd + A ============
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
    e.preventDefault()

    const items = elements.list.querySelectorAll("li")
    const allSelected = elements.list.querySelectorAll("li.selected").length === items.length

    if (allSelected) {
      clearSelection()
    } else {
      items.forEach((li) => {
        li.classList.add("selected")
        li.querySelector(".index-btn").classList.add("selected")
      })
    }
  }
})

// ============ Delete ============
function handleDelete() {
  const selectedIndices = getSelectedIndices()
  const deleted = []

  if (selectedIndices.length) {
    // Sort descending to avoid index shifting during deletion
    selectedIndices.sort((a, b) => b - a).forEach((i) => {
      deleted.push(`${i}. ${myLeads.splice(i - 1, 1)[0]}`)
    })
  } else if (myLeads.length) {
    deleted.push(`1. ${myLeads.shift()}`)
  }

  if (deleted.length) {
    elements.input.value = deleted.join(" + ")
    storage.set(myLeads)
    clearSelection()
    render(myLeads)
  }
}

elements.deleteBtn.addEventListener("click", handleDelete)

window.addEventListener("keydown", (e) => {
  if (e.key === "Delete" && elements.input.value.trim() === "") {
    handleDelete()
  }
})

// ============ Save Input ============
elements.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") elements.inputBtn.click()
})

elements.inputBtn.addEventListener("click", () => {
  const inputValue = elements.input.value.trim()
  if (!inputValue) return

  const match = inputValue.match(INDEX_INPUT_REGEX)

  if (match) {
    const index = parseInt(match[1], 10) - 1
    const text = match[2]
    
    // Insert at specified position or append if out of range
    if (index >= 0 && index <= myLeads.length) {
      myLeads.splice(index, 0, text)
    } else {
      myLeads.push(text)
    }
  } else {
    myLeads.unshift(inputValue)
  }

  elements.input.value = ""
  storage.set(myLeads)
  render(myLeads)
})

// ============ Save Tab ============
elements.tabBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    myLeads.unshift(tabs[0].url)
    storage.set(myLeads)
    render(myLeads)
  })
})

// ============ Open Links ============
elements.openLinksBtn.addEventListener("click", () => {
  const selectedIndices = getSelectedIndices()
  const indicesToOpen = selectedIndices.length ? selectedIndices : (myLeads.length ? [1] : [])

  indicesToOpen.forEach((i) => {
    const url = makeURL(myLeads[i - 1])
    window.open(url, "_blank")
  })
})

// ============ Copy Selected ============
elements.copyBtn.addEventListener("click", async () => {
  const selectedIndices = getSelectedIndices()
  if (!selectedIndices.length) return

  const text = selectedIndices
    .sort((a, b) => a - b)
    .map((i) => myLeads[i - 1])
    .join("\n")

  await copyToClipboard(text)
})

// ============ File Input ============
elements.openFilesBtn.addEventListener("click", () => {
  elements.fileInput.click()
})

elements.fileInput.addEventListener("change", function () {
  Array.from(this.files).forEach((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const blob = new Blob([e.target.result], { type: file.type })
      chrome.tabs.create({ url: URL.createObjectURL(blob) })
    }
    reader.readAsArrayBuffer(file)
  })
})