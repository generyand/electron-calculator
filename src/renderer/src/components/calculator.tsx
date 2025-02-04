import { useState, useEffect } from 'react'
import * as math from 'mathjs'

type OperatorType = '+' | '-' | '*' | '/' | '(' | ')'

const Calculator = (): JSX.Element => {
  const [display, setDisplay] = useState<string>('0')
  const [equation, setEquation] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isNewNumber, setIsNewNumber] = useState<boolean>(true)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [openParenCount, setOpenParenCount] = useState<number>(0)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // Listen to system theme changes
  useEffect(() => {
    // Check initial system theme
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setTheme(darkModeMediaQuery.matches ? 'dark' : 'light')

    // Listen for theme changes
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light')
    }

    darkModeMediaQuery.addEventListener('change', handleThemeChange)

    // Cleanup listener
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleThemeChange)
    }
  }, [])

  const handleNumber = (number: string) => {
    setError('')
    // Prevent multiple decimal points
    if (number === '.' && display.includes('.')) return

    if (isNewNumber) {
      setDisplay(number === '.' ? '0.' : number)
      setIsNewNumber(false)
    } else {
      setDisplay(display + number)
    }
  }

  const handleOperator = (operator: OperatorType) => {
    setError('')
    if (equation === '') {
      // First operation
      setEquation(display + ' ' + operator + ' ')
    } else {
      // Chain operations by appending to the equation
      setEquation(equation + display + ' ' + operator + ' ')
    }
    setIsNewNumber(true)
  }

  const handleEqual = () => {
    try {
      const fullExpression = equation + display
      if (!equation) return
      
      const result = math.evaluate(fullExpression)
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid calculation')
      }
      
      // Vibrate on calculation complete (mobile feedback)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      
      const formattedResult = Number(result).toLocaleString('en-US', {
        maximumFractionDigits: 8,
        useGrouping: true
      })
      
      setEquation(fullExpression + ' = ')
      setDisplay(formattedResult)
      setIsNewNumber(true)
    } catch (err) {
      console.error('Calculation error:', err)
      setError('Error')
      setDisplay('0')
      setEquation('')
      setIsNewNumber(true)
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setEquation('')
    setError('')
    setIsNewNumber(true)
  }

  const handleBackspace = () => {
    setError('')
    if (display === '0') return
    
    // If only one digit left, set to '0'
    if (display.length === 1) {
      setDisplay('0')
      setIsNewNumber(true)
      return
    }
    
    // Remove last digit
    setDisplay(display.slice(0, -1))
  }

  // Add keyboard support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.match(/[0-9.]/)) {
        handleNumber(e.key)
      } else if (e.key.match(/[-+*/]/)) {
        handleOperator(e.key as OperatorType)
      } else if (e.key === 'Enter') {
        handleEqual()
      } else if (e.key === 'Escape') {
        handleClear()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [display, equation])

  return (
    <div className={`w-full h-screen min-w-[300px] min-h-[450px] transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    } flex items-center justify-center`}>
      <div className={`${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } w-full h-full flex flex-col`}>
        {/* Display Section */}
        <div className={`flex-none h-2/5 p-6 flex flex-col justify-end ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
        }`}>
          <div className={`text-base min-h-6 text-right break-words overflow-y-auto max-h-20 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {equation}
            {openParenCount > 0 && <span className="text-blue-400">{` (×${openParenCount})`}</span>}
          </div>
          <div className={`text-4xl font-light text-right break-words mt-4 truncate ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {error || display}
          </div>
        </div>
        
        {/* Keypad Section */}
        <div className={`flex-grow grid grid-cols-4 gap-[1px] ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          {/* First Row */}
          <button 
            onClick={handleClear}
            className={`text-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-red-400'
                : 'bg-white hover:bg-gray-50 text-red-500'
            }`}
          >
            AC
          </button>
          <button 
            onClick={handleBackspace}
            className={`text-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                : 'bg-white hover:bg-gray-50 text-blue-500'
            }`}
            aria-label="Backspace"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className="w-6 h-6 inline-block"
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
          <button 
            onClick={() => {/* implement % */}}
            className={`text-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                : 'bg-white hover:bg-gray-50 text-blue-500'
            }`}
          >
            %
          </button>
          <button 
            onClick={() => handleOperator('/')}
            className={`text-xl font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                : 'bg-white hover:bg-gray-50 text-blue-500'
            }`}
          >
            ÷
          </button>

          {/* Numbers 7-9 */}
          {[7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumber(num.toString())}
              className={`text-xl transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-900'
              }`}
            >
              {num}
            </button>
          ))}
          <button 
            onClick={() => handleOperator('*')}
            className={`text-xl font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                : 'bg-white hover:bg-gray-50 text-blue-500'
            }`}
          >
            ×
          </button>

          {/* Numbers 4-6 */}
          {[4, 5, 6].map(num => (
            <button
              key={num}
              onClick={() => handleNumber(num.toString())}
              className={`text-xl transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-900'
              }`}
            >
              {num}
            </button>
          ))}
          <button 
            onClick={() => handleOperator('-')}
            className={`text-xl font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                : 'bg-white hover:bg-gray-50 text-blue-500'
            }`}
          >
            −
          </button>

          {/* Numbers 1-3 */}
          {[1, 2, 3].map(num => (
            <button
              key={num}
              onClick={() => handleNumber(num.toString())}
              className={`text-xl transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-900'
              }`}
            >
              {num}
            </button>
          ))}
          <button 
            onClick={() => handleOperator('+')}
            className={`text-xl font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                : 'bg-white hover:bg-gray-50 text-blue-500'
            }`}
          >
            +
          </button>

          {/* Bottom Row */}
          <button 
            onClick={() => handleNumber('0')}
            className={`col-span-2 text-xl transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-white hover:bg-gray-50 text-gray-900'
            }`}
          >
            0
          </button>
          <button 
            onClick={() => handleNumber('.')}
            className={`text-xl transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-white hover:bg-gray-50 text-gray-900'
            }`}
          >
            .
          </button>
          <button 
            onClick={handleEqual}
            className={`text-xl font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            =
          </button>
        </div>
      </div>
    </div>
  )
}

export default Calculator