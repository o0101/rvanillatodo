"use strict";
import {R} from './r.js';
{
  const root = document.querySelector('.todoapp');
  const todos = load();
  const session = Math.random()+'';
  let keyCounter = 0;
  let AllRouteLink;

  openApp();

  function openApp() {
    App().to(root,'innerHTML');
    addEventListener('hashchange', routeHash);
    routeHash();
  }

  function changeHash(e) {
    e.preventDefault();
    history.replaceState(null,null,e.target.href);
    routeHash();
  }

  function App() {
    return R`
      <header class="header">
        <h1>todos</h1>
        <input class="new-todo" placeholder="What needs to be done?" autofocus
          keydown=${newTodoIfEnter} 
        >
      </header>
      <section class="main">
        <input id="toggle-all" class="toggle-all" type="checkbox" click=${toggleAll}>
        <label for="toggle-all">Mark all as complete</label>
        <ul class=todo-list>
          ${TodoList([])}
        </ul>
        <footer class="footer">
          <span class="todo-count">
            ${TodoCount({activeCount:0})}
          </span>
          <ul class="filters">
            <li>
              <a href="#/" click=${changeHash} class="selected">All</a>
            </li>
            <li>
              <a href="#/active" click=${changeHash}>Active</a>
            </li>
            <li>
              <a href="#/completed" click=${changeHash}>Completed</a>
            </li>
          </ul>
          <button click="${clearCompleted}" class=clear-completed>Clear completed</button>
        </footer>
      </section>
    `;
  }

  function TodoList(list) {
    const retVal = R`
      <!-- Todo List-->
      ${list.map(Todo)}
    `;
    return retVal;
  }

  function Todo({key,text,completed,active,editing}) {
    return R`${{key}}
      <li data-key=${key} class="${
          completed ? 'completed' : ''} ${
          active ? 'active' : ''} ${
          editing ? 'editing' : ''}">
        <div class="view">
          <input class="toggle" type="checkbox" 
            ${completed ? 'checked':''} input=${e => toggleCompleted(e,key)}>
          <label touchstart=${() => editTodo(key)} dblclick=${() => editTodo(key)}>${text}</label>
          <button class="destroy" click=${() => deleteTodo(key)}></button>
        </div>
        ${editing ? R`<input class=edit value=${text}
              keydown=${keyEvent => saveTodoIfEnter(keyEvent,key)}
              blur=${() => saveTodo(key)}>`
          : ''
        }
      </li>
    `;
  }

  function TodoCount({activeCount}) {
    return R`
      <span class="todo-count">
        <strong>${activeCount}</strong>
        items left
      </span>
    `;
  }

  function routeHash() {
    switch(location.hash) {
      case "#/active":                listActive(); break;
      case "#/completed":             listCompleted(); break;
      case "#/":          default:    listAll(); break;
    }
    selectRoute(location.hash);
  }

  function newKey(prefix) {
    return `key-${prefix ? prefix + '-' : ''}${session}-${keyCounter++}`;
  }

  function load() {
    return JSON.parse(localStorage.getItem('todos')) || [];
  }

  function save() {
    localStorage.setItem('todos', JSON.stringify(todos));
  }

  function updateList(list = todos) {
    TodoList(list);
    TodoCount({activeCount:todos.filter(t => !t.completed).length});
  }
  
  function updateTodo(todo) {
    save();
    const node = root.querySelector(`[data-key="${todo.key}"]`);
    Todo(todo);
    TodoCount({activeCount:todos.filter(t => !t.completed).length});
  }

  function addTodo(todo) {
    todos.push(todo);
    save();
    Todo(todo).to('.todo-list', 'afterBegin');
    TodoCount({activeCount:todos.filter(t => !t.completed).length});
  }

  function toggleCompleted({target},todoKey) {
    const checked = target.checked;
    const todo = todos.find(({key}) => key == todoKey);
    todo.completed = target.checked;
    if ( ! todo.completed ) {
      todo.active = true;
    } else {
      todo.active = false;
    }
    save();
    Todo(todo);
  }

  function editTodo(todoKey) {
    const todo = todos.find(({key}) => key == todoKey);
    if ( todo.editing ) return;
    todo.editing = true;
    updateTodo(todo);
  }

  function deleteTodo(todoKey) {
    const index = todos.findIndex(({key}) => key == todoKey);
    if ( index >= 0 ) {
      const todo = todos.splice(index,1); 
      save();
      updateList();
      console.log(JSON.stringify({todoKey,index,todo,todos},null,2));
    } else {
      throw {error: {msg:`Cannot find todo with key ${todoKey}`}};
    }
  }

  function saveTodo(todoKey) {
    const todo = todos.find(({key}) => key == todoKey);
    if ( ! todo || ! todo.editing ) {
      return;
    }
    const node = root.querySelector('input.edit');
    const text = node.value.trim();
    if ( text.length == 0 ) {
      return deleteTodo(todoKey);
    }
    todo.editing = false;
    todo.text = text;
    updateTodo(todo);
  }

  function clearCompleted() {
    const completed = todos.filter(({completed}) => completed);
    completed.forEach(({key}) => deleteTodo(key));
    TodoList(todos);
  }

  function toggleAll({target:{checked}}) {
    todos.forEach(t => t.completed = !!checked);
    todos.forEach(t => Todo(t));
  }

  function listAll() {
    updateList(todos);
  }

  function listCompleted() {
    updateList(todos.filter( t => t.completed ));
  }

  function listActive() {
    updateList(todos.filter( t => !t.completed ));
  }

  function saveTodoIfEnter(keyEvent,key) {
    if ( keyEvent.key !== 'Enter' ) {
      return;
    }
    saveTodo(key);
  }

  function newTodoIfEnter(keyEvent) {
    if ( keyEvent.key !== 'Enter' ) {
      return;
    }
    const {target:source} = keyEvent;
    const text = source.value.trim();
    if ( ! text ) {
      return; 
    }
    const todo = {
      key: newKey('todo'),
      text,
      active: true,
      completed: false,
      editing: false
    };
    addTodo(todo);
    source.value = '';
  }

  function selectRoute(hash) {
    const selectedRoute = root.querySelector(`a[href="${hash}"]`) || AllRouteLink ||
      (AllRouteLink = root.querySelector(`a[href="#/"]`));
    const lastSelectedRoute = root.querySelector(`.filters a.selected`);
    lastSelectedRoute.classList.remove('selected');
    selectedRoute.classList.add('selected');
  }
}
