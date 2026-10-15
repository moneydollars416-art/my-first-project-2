import React from 'react'
import todogeader from './Components/todogeader'
import todosearch from './Components/todosearch'
import todoList from './Components/todoList'
import todoAdd from './Components/todoAdd'

const App = () => {
  return (
    <div>
      <todogeader/>
      <todosearch/>
      <todoList/>
      <todoAdd/>
    </div>
  )
}

export default App
