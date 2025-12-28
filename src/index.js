import "./styles.css";
import { format, parseISO, isBefore, startOfToday } from "date-fns";

// Sets the minimum dueDate for date selection (automatically set to current date)
const dueDate = document.querySelector("#dueDate");
const todayStr = format(new Date(), "yyyy-MM-dd");
dueDate.min = todayStr;
dueDate.value = todayStr;

// For assigning all current and future buttons and event listeners for modals
const modals = document.querySelectorAll("dialog");
const openButtons = document.querySelectorAll("[data-open-modal]");
const closeButtons = document.querySelectorAll(".closeModal");

openButtons.forEach((button) => {
  const modalSelector = button.dataset.openModal;
  const modal = document.querySelector(modalSelector);
  button.addEventListener("click", () => {
    modal.showModal();

    const form = modal.querySelector("form");
    if (form) form.reset();

    const dateInput = modal.querySelector("#dueDate");
    if (dateInput) dateInput.value = todayStr;
  });
});

modals.forEach((modal) => {
  modal.addEventListener("close", () => {
    const submitBtn = modal.querySelector(".addTask");
    if (submitBtn) submitBtn.textContent = "Add";

    isEditing = false;
    taskBeingEdited = null;

    const form = modal.querySelector("form");
    if (form) form.reset();
  });
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("dialog[open]").forEach((modal) => modal.close());
  });
});

// Helper function for building card elements
function elementBuilder(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.classList.add(cls);
  if (text != null) {
    el.textContent = text;
  }
  return el;
}

// Init for tab management
const tabsContainer = document.querySelector(".tabsContainer");
const tasksContainer = document.querySelector(".tasksContainer");
const tabs = [];
let activeTab = null;
let isEditing = false;
let taskBeingEdited = null;

// Tab Creation
class Tab {
  constructor(name, isGeneral = false) {
    this.tabID = crypto.randomUUID();
    this.tabName = name;
    this.isGeneral = isGeneral;
    this.tasks = [];
  }

  addTask(task) {
    this.tasks.push(task);
  }

  removeTask(taskID) {
    this.tasks = this.tasks.filter((t) => t.taskID !== taskID);
  }

  static fromStorage(data) {
    const tab = new Tab(data.tabName, data.isGeneral);
    tab.tabID = data.tabID;
    tab.tasks = data.tasks.map(Task.fromStorage);
    return tab;
  }

  // renders newly created tabs in tab container
  render() {
    const tabEntry = elementBuilder("div", "tabEntry");
    tabEntry.dataset.tabID = this.tabID;

    const tabBtn = elementBuilder("button", "tab", this.tabName);

    if (activeTab === this) {
      tabEntry.classList.add("active");
    }

    tabBtn.addEventListener("click", () => {
      activeTab = this;
      renderTabs();
      renderActiveTab();
    });

    tabEntry.append(tabBtn);

    if (!this.isGeneral && activeTab === this) {
      const tabRemoveBtn = elementBuilder("button", "tabRemoveBtn", "Remove");
      tabRemoveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeTab(this.tabID);
      });
      tabEntry.append(tabRemoveBtn);
    }

    return tabEntry;
  }

  // loads the tasks in the active tab
  renderTasks() {
    tasksContainer.innerHTML = "";

    if (this.tasks.length === 0) {
      const emptyState = elementBuilder(
        "p",
        "emptyState",
        "No tasks currently..."
      );
      tasksContainer.append(emptyState);
      return;
    }

    this.tasks.forEach((task) => {
      const taskEl = task.render((taskID) => {
        this.removeTask(taskID);
        saveToLocalStorage();
        this.renderTasks();
      }, editTask);
      tasksContainer.append(taskEl);
    });
  }
}

// Init general tab
let generalTab = null;

function initGeneralTab() {
  generalTab = new Tab("General", true);
  tabs.push(generalTab);
  activeTab = generalTab;
}

// Pushes new tab into tabs list
function addTabToList(name) {
  const tab = new Tab(name);
  tabs.push(tab);
  renderTabs();
  saveToLocalStorage();
}

// Tab form add button
const tabForm = document.querySelector(".tabForm form");
tabForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const tabInput = tabForm.querySelector("#tab");
  const tabName = tabInput.value.trim();

  if (!tabName) {
    tabInput.focus();
    tabInput.setCustomValidity("Please enter a tab name");
    tabInput.reportValidity();
    return;
  }
  tabInput.setCustomValidity("");

  addTabToList(tabName);

  tabForm.reset();
  tabForm.closest("dialog").close();
});

// Task creation
class Task {
  constructor(name, dueDate, desc, priority) {
    this.taskID = crypto.randomUUID();
    this.taskName = name;
    this.dueDate = dueDate;
    this.desc = desc;
    this.priority = priority;
    this.completed = false;
  }

  static fromStorage(data) {
    const task = new Task(
      data.taskName,
      data.dueDate,
      data.desc,
      data.priority
    );
    task.taskID = data.taskID;
    task.completed = data.completed ?? false;
    return task;
  }

  // renders newly created tasks in the active tab task container
  render(onRemove, onEdit) {
    const card = elementBuilder("article", "card");
    card.dataset.taskID = this.taskID;

    if (this.completed) card.classList.add("completed");

    if (this.dueDate) {
      const due = parseISO(this.dueDate);
      const today = startOfToday();

      if (isBefore(due, today)) {
        card.classList.add("overdue");
      } else if (
        isBefore(due, new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000))
      ) {
        card.classList.add("dueSoon");
      }
    }

    const cardHeader = elementBuilder("div", "cardHeader");

    const taskCheckbox = elementBuilder("input", "taskCheckbox");
    taskCheckbox.type = "checkbox";
    taskCheckbox.checked = this.completed;
    taskCheckbox.addEventListener("change", () => {
      this.completed = taskCheckbox.checked;
      card.classList.toggle("completed", this.completed);
      saveToLocalStorage();
    });

    const taskName = elementBuilder("h2", "taskName", this.taskName);
    const taskEditBtn = elementBuilder("button", "taskEditBtn", "Edit");
    taskEditBtn.addEventListener("click", () => onEdit(this));

    const desc = elementBuilder("div", "desc", this.desc);

    const cardFooter = elementBuilder("div", "cardFooter");
    const dueDate = elementBuilder("p", "dueDate", this.dueDate);
    const priority = elementBuilder("button", "priority", this.priority);
    priority.classList.add(this.priority);

    const updatePriorityVisuals = () => {
      priority.classList.remove("low", "medium", "high");
      priority.classList.add(this.priority);

      cardFooter.classList.remove("low", "medium", "high");
      cardFooter.classList.add(this.priority);
    };

    priority.addEventListener("click", () => {
      const levels = ["low", "medium", "high"];
      const currentIndex = levels.indexOf(this.priority);
      const nextIndex = (currentIndex + 1) % levels.length;
      this.priority = levels[nextIndex];
      priority.textContent = this.priority;
      saveToLocalStorage();
      updatePriorityVisuals();
    });

    updatePriorityVisuals();

    const taskRemoveBtn = elementBuilder("button", "taskRemoveBtn", "Remove");
    taskRemoveBtn.addEventListener("click", () => onRemove(this.taskID));

    cardHeader.append(taskCheckbox, taskName, taskEditBtn);
    cardFooter.append(dueDate, priority, taskRemoveBtn);
    card.append(cardHeader, desc, cardFooter);

    return card;
  }
}

// Task form add button
const taskForm = document.querySelector(".taskForm form");

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!activeTab) return;

  const taskNameInput = taskForm.querySelector("#task");
  const taskName = taskNameInput.value.trim();

  if (!taskName) {
    taskNameInput.focus();
    taskNameInput.setCustomValidity("Please enter a task name");
    taskNameInput.reportValidity();
    return;
  }
  taskNameInput.setCustomValidity("");

  const taskDueDate = taskForm.querySelector("#dueDate").value;
  const taskDesc = taskForm.querySelector("#desc").value;
  const taskPriority = taskForm.querySelector(
    'input[name="task_priority"]:checked'
  ).id;

  if (isEditing && taskBeingEdited) {
    taskBeingEdited.taskName = taskName;
    taskBeingEdited.dueDate = taskDueDate;
    taskBeingEdited.desc = taskDesc;
    taskBeingEdited.priority = taskPriority;
  } else {
    const task = new Task(taskName, taskDueDate, taskDesc, taskPriority);
    activeTab.addTask(task);
  }

  renderActiveTab();
  saveToLocalStorage();

  taskForm.reset();
  taskForm.closest("dialog").close();

  isEditing = false;
  taskBeingEdited = null;
});

// Global coordinator functions
// Filters in header
const taskSearch = document.querySelector("#taskSearch");
const priorityFilter = document.querySelector("#priorityFilter");
const statusFilter = document.querySelector("#statusFilter");

function filterTasks() {
  if (!activeTab) return;

  const searchTerm = taskSearch.value.toLowerCase();
  const priority = priorityFilter.value;
  const status = statusFilter.value;

  const noFilterApplied =
    searchTerm === "" && priority === "all" && status === "all";

  if (noFilterApplied) {
    activeTab.renderTasks();
    return;
  }

  const filteredTasks = activeTab.tasks.filter((task) => {
    const matchesSearch = task.taskName.toLowerCase().includes(searchTerm);
    const matchesPriority = priority === "all" || task.priority === priority;
    const matchesStatus =
      status === "all" ||
      (status === "completed" && task.completed) ||
      (status === "pending" && !task.completed);

    return matchesSearch && matchesPriority && matchesStatus;
  });

  tasksContainer.innerHTML = "";

  if (filteredTasks.length === 0) {
    const emptyState = elementBuilder(
      "p",
      "emptyState",
      "No tasks match your filter..."
    );
    tasksContainer.append(emptyState);
    return;
  }

  filteredTasks.forEach((task) => {
    const taskEl = task.render((taskID) => {
      activeTab.removeTask(taskID);
      saveToLocalStorage();
      filterTasks();
    }, editTask);
    tasksContainer.append(taskEl);
  });
}

// Listen for changes
taskSearch.addEventListener("input", filterTasks);
priorityFilter.addEventListener("change", filterTasks);
statusFilter.addEventListener("change", filterTasks);

// Tab functions
function renderTabs() {
  tabsContainer.innerHTML = "";
  tabs.forEach((tab) => tabsContainer.append(tab.render()));
}

function renderActiveTab() {
  if (!activeTab) return;
  activeTab.renderTasks();
}

function removeTab(tabID) {
  const index = tabs.findIndex((t) => t.tabID === tabID);
  if (index === -1) return;

  if (tabs[index] === activeTab) {
    activeTab = tabs[0];
  }

  tabs.splice(index, 1);
  renderTabs();
  renderActiveTab();
  saveToLocalStorage();
}

// Edit task function
function editTask(task) {
  isEditing = true;
  taskBeingEdited = task;

  const taskFormDialog = document.querySelector(".taskForm");
  const taskForm = taskFormDialog.querySelector("form");

  taskForm.querySelector("#task").value = task.taskName;
  taskForm.querySelector("#dueDate").value = task.dueDate;
  taskForm.querySelector("#desc").value = task.desc;

  taskForm
    .querySelectorAll('input[name="task_priority"]')
    .forEach((input) => (input.checked = input.id === task.priority));

  taskFormDialog.querySelector(".addTask").textContent = "Edit";

  taskFormDialog.showModal();
}

// Local Storage functions
function saveToLocalStorage() {
  const data = tabs.map((tab) => ({
    tabID: tab.tabID,
    tabName: tab.tabName,
    isGeneral: tab.isGeneral,
    tasks: tab.tasks.map((task) => ({
      taskID: task.taskID,
      taskName: task.taskName,
      dueDate: task.dueDate,
      desc: task.desc,
      priority: task.priority,
      completed: task.completed,
    })),
  }));
  localStorage.setItem("todoData", JSON.stringify(data));
}

function loadFromLocalStorage() {
  const data = JSON.parse(localStorage.getItem("todoData") || "[]");
  if (!data) return;

  tabs.length = 0;
  data.forEach((tabData) => {
    const tab = Tab.fromStorage(tabData);
    tabs.push(tab);
  });

  activeTab = tabs.find((t) => t.isGeneral) || tabs[0];
}

document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage();
  if (tabs.length === 0) initGeneralTab();
  renderTabs();
  renderActiveTab();
});
