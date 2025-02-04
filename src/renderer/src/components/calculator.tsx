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
  const [memory, setMemory] = useState<number>(0)
  const [showMemory, setShowMemory] = useState<boolean>(false)
  const MAX_DIGITS = 16

  // Add constants
  const MAX_VALUE = 1e308
  const MIN_VALUE = -1e308

  // Add validation helper functions
  const isValidNumber = (num: number): boolean => {
    return !isNaN(num) && isFinite(num) && num > MIN_VALUE && num < MAX_VALUE
  }

  const formatNumber = (num: number): string => {
    if (Math.abs(num) >= 1e16 || (Math.abs(num) < 1e-7 && num !== 0)) {
      return num.toExponential(10)
    }
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 8,
      useGrouping: true
    })
  }

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
    if (display.replace(/[,.]/g, '').length >= MAX_DIGITS) return
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

  const handlePercent = () => {
    try {
      const currentValue = parseFloat(display)
      if (!equation) {
        const result = currentValue / 100
        setDisplay(formatNumber(result))
      } else {
        const baseValue = parseFloat(equation.split(' ')[0])
        const result = (baseValue * currentValue) / 100
        setDisplay(formatNumber(result))
      }
    } catch (err) {
      setError('Error')
    }
  }

  const handleEqual = () => {
    try {
      const fullExpression = equation + display
      if (!equation) return
      
      // Validate parentheses
      if ((fullExpression.match(/\(/g) || []).length !== 
          (fullExpression.match(/\)/g) || []).length) {
        throw new Error('Mismatched parentheses')
      }

      // Validate operators
      if (/[+\-*/]{2,}/.test(fullExpression)) {
        throw new Error('Invalid operator sequence')
      }

      const result = math.evaluate(fullExpression)
      
      if (!isValidNumber(result)) {
        throw new Error('Result out of range')
      }

      // Vibrate on calculation complete
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      
      setEquation(fullExpression + ' = ')
      setDisplay(formatNumber(result))
      setIsNewNumber(true)
    } catch (err) {
      console.error('Calculation error:', err)
      setError(err instanceof Error ? err.message : 'Error')
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

  // Add memory functions
  const handleMemoryAdd = () => {
    try {
      const currentValue = parseFloat(display)
      setMemory(memory + currentValue)
      setShowMemory(true)
      setIsNewNumber(true)
    } catch (err) {
      setError('Error')
    }
  }

  const handleMemorySubtract = () => {
    try {
      const currentValue = parseFloat(display)
      setMemory(memory - currentValue)
      setShowMemory(true)
      setIsNewNumber(true)
    } catch (err) {
      setError('Error')
    }
  }

  const handleMemoryRecall = () => {
    if (memory !== 0) {
      setDisplay(formatNumber(memory))
      setIsNewNumber(true)
    }
  }

  const handleMemoryClear = () => {
    setMemory(0)
    setShowMemory(false)
  }

  // Update keyboard support
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
      } else if (e.key === 'Backspace') {
        handleBackspace()
      } else if (e.key === '%') {
        handlePercent()
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
            {showMemory && <span className="mr-2">M</span>}
            {equation}
            {openParenCount > 0 && <span className="text-blue-400">{` (×${openParenCount})`}</span>}
          </div>
          <div className={`text-4xl font-light text-right break-words mt-4 truncate ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {error || display}
          </div>
        </div>
        
        {/* Keypad Section - Clean layout with 6 rows */}
        <div className={`flex-grow grid grid-cols-4 gap-[1px] ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          {/* Memory Function Row */}
          <button 
            onClick={handleMemoryClear}
            className={`text-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                : 'bg-white hover:bg-gray-50 text-blue-500'
            }`}
          >
            MC
          </button>
          <button 
            onClick={handleMemoryRecall}
            className={`text-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                : 'bg-white hover:bg-gray-50 text-blue-500'
            }`}
          >
            MR
          </button>
          <button 
            onClick={handleMemoryAdd}
            className={`text-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                : 'bg-white hover:bg-gray-50 text-blue-500'
            }`}
          >
            M+
          </button>
          <button 
            onClick={handleMemorySubtract}
            className={`text-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                : 'bg-white hover:bg-gray-50 text-blue-500'
            }`}
          >
            M-
          </button>

          {/* Clear and Special Functions Row */}
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
            onClick={handlePercent}
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

          {/* Parentheses Row */}
          <button 
            onClick={() => handleOperator('(')}
            className={`text-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                : 'bg-white hover:bg-gray-50 text-blue-500'
            }`}
          >
            (
          </button>
          <button 
            onClick={() => handleOperator(')')}
            className={`text-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                : 'bg-white hover:bg-gray-50 text-blue-500'
            }`}
          >
            )
          </button>
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
            onClick={() => handleOperator('+')}
            className={`text-xl font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                : 'bg-white hover:bg-gray-50 text-blue-500'
            }`}
          >
            +
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
            onClick={handleEqual}
            className={`text-xl font-medium transition-colors row-span-3 ${
              theme === 'dark'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            =
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
        </div>
      </div>
    </div>
  )
}

export default Calculator