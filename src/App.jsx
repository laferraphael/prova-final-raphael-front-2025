import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import FilmeApp from './Filme.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <FilmeApp></FilmeApp>
      </div>
    </>
  )
}

export default App
