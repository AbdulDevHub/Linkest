let myLeads = []
let lastSelectedIndex = null

const inputEl = document.getElementById("input-el")
const inputBtn = document.getElementById("input-btn")
const ulEl = document.getElementById("ul-el")
const deleteBtn = document.getElementById("delete-btn")
const leadsFromLocalStorage = JSON.parse(localStorage.getItem("myLeads"))
const tabBtn = document.getElementById("tab-btn")
const openFilesBtn = document.getElementById("open-files-btn")
const openLinksBtn = document.getElementById("open-links-btn")
const copyBtn = document.getElementById("copy-btn")
const fileInput = document.getElementById("file-input")

// ============ Load ============
if (leadsFromLocalStorage) {
  myLeads = leadsFromLocalStorage
  render(myLeads)
}

// ============ Render ============
function render(leads) {
  ulEl.innerHTML = leads
    .map((lead, i) => {
      let url = lead
      let className = ""

      if (!/^https?:\/\//i.test(lead)) {
        url = "https://www.google.com/search?q=" + encodeURIComponent(lead)
        className = "notURL"
      }

      return `
        <li data-index="${i + 1}" class="${className}">
          <button class="index-btn" data-index="${i + 1}">${i + 1}</button>
          <a class="lead-link" href="${url}">${lead}</a>
        </li>
      `
    })
    .join("")

  attachSelectionHandlers()
  attachItemClickHandlers()
}

// ============ Selection Logic ============
function attachSelectionHandlers() {
  const buttons = ulEl.querySelectorAll(".index-btn")

  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()

      const index = parseInt(btn.dataset.index)
      const li = btn.closest("li")

      if (e.shiftKey && lastSelectedIndex !== null) {
        selectRange(lastSelectedIndex, index)
      } else {
        toggleItem(li, btn)
      }

      lastSelectedIndex = index
    })
  })
}

function toggleItem(li, btn) {
  li.classList.toggle("selected")
  btn.classList.toggle("selected")
}

function selectRange(from, to) {
  const [start, end] = [from, to].sort((a, b) => a - b)
  const items = ulEl.querySelectorAll("li")

  for (let i = start - 1; i <= end - 1; i++) {
    items[i].classList.add("selected")
    items[i].querySelector(".index-btn").classList.add("selected")
  }
}

function clearSelection() {
  ulEl
    .querySelectorAll(".selected")
    .forEach((el) => el.classList.remove("selected"))
  lastSelectedIndex = null
}

// ============ Item Click + Copy + Ctrl/Open ============
function attachItemClickHandlers() {
  const items = ulEl.querySelectorAll("li")

  items.forEach((li) => {
    li.addEventListener("click", async (e) => {
      // Ignore index button (handled separately)
      if (e.target.classList.contains("index-btn")) return

      const link = li.querySelector("a")
      const index = parseInt(li.dataset.index)
      const btn = li.querySelector(".index-btn")

      // CTRL / CMD + CLICK → OPEN LINK
      if (e.ctrlKey || e.metaKey) {
        // Let the browser handle Ctrl/Cmd+click normally
        return
      }

      // Normal click → prevent navigation
      e.preventDefault()

      // Toggle selection
      toggleItem(li, btn)
      lastSelectedIndex = li.classList.contains("selected") ? index : null

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(myLeads[index - 1])
      } catch (err) {
        console.error("Clipboard copy failed", err)
      }
    })
  })
}

// ============ Ctrl/Cmd + A ============
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
    e.preventDefault()

    const items = ulEl.querySelectorAll("li")
    const selected = ulEl.querySelectorAll("li.selected")

    if (selected.length === items.length) {
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
  const selectedItems = Array.from(ulEl.querySelectorAll("li.selected"))
  let deleted = []

  if (selectedItems.length) {
    const indices = selectedItems
      .map((li) => parseInt(li.dataset.index))
      .sort((a, b) => b - a)

    indices.forEach((i) => {
      deleted.push(`${i}. ${myLeads.splice(i - 1, 1)[0]}`)
    })
  } else if (myLeads.length) {
    deleted.push(`1. ${myLeads.shift()}`)
  }

  if (deleted.length) {
    inputEl.value = deleted.join(" + ")
    localStorage.setItem("myLeads", JSON.stringify(myLeads))
    clearSelection()
    render(myLeads)
  }
}

deleteBtn.addEventListener("click", handleDelete)

window.addEventListener("keydown", (e) => {
  if (e.key === "Delete" && inputEl.value.trim() === "") {
    handleDelete()
  }
})

// ============ Save Input ============
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") inputBtn.click()
})

inputBtn.addEventListener("click", () => {
  const inputValue = inputEl.value.trim()
  if (!inputValue) return

  // Match "N. text"
  const match = inputValue.match(/^(\d+)\.\s*(.+)$/)

  if (match) {
    const index = parseInt(match[1], 10) - 1
    const text = match[2]

    if (index >= 0 && index <= myLeads.length) {
      myLeads.splice(index, 0, text)
    } else {
      myLeads.push(text)
    }
  } else {
    myLeads.unshift(inputValue)
  }

  inputEl.value = ""
  localStorage.setItem("myLeads", JSON.stringify(myLeads))
  render(myLeads)
})

// ============ Save Tab ============
tabBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    myLeads.unshift(tabs[0].url)
    localStorage.setItem("myLeads", JSON.stringify(myLeads))
    render(myLeads)
  })
})

// ============ Open ============
openFilesBtn.addEventListener("click", () => {
  fileInput.click()
})

openLinksBtn.addEventListener("click", () => {
  const selected = Array.from(ulEl.querySelectorAll("li.selected"))

  let indices = selected.length
    ? selected.map((li) => parseInt(li.dataset.index))
    : myLeads.length
    ? [1]
    : []

  indices.forEach((i) => {
    let url = myLeads[i - 1]
    if (!/^https?:\/\//i.test(url)) {
      url = "https://www.google.com/search?q=" + encodeURIComponent(url)
    }
    window.open(url, "_blank")
  })
})

copyBtn.addEventListener("click", async () => {
  const selected = Array.from(ulEl.querySelectorAll("li.selected"))
  if (!selected.length) return

  const text = selected
    .map((li) => parseInt(li.dataset.index))
    .sort((a, b) => a - b)
    .map((i) => myLeads[i - 1])
    .join("\n")

  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error("Clipboard copy failed", err)
  }
})

// ============ File Input ============
fileInput.addEventListener("change", function () {
  Array.from(this.files).forEach((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const blob = new Blob([e.target.result], { type: file.type })
      chrome.tabs.create({ url: URL.createObjectURL(blob) })
    }
    reader.readAsArrayBuffer(file)
  })
})
