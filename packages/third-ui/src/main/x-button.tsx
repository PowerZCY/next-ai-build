'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { globalLucideIcons as icons } from '@base-ui/components/global-icon'

// base button config
interface BaseButtonConfig {
  icon: ReactNode
  text: string
  onClick: () => void | Promise<void>
  disabled?: boolean
}

// menu item config
interface MenuItemConfig extends BaseButtonConfig {
  tag?: {
    text: string
    color?: string
  }
  splitTopBorder?: boolean
}

// single button config
interface SingleButtonProps {
  type: 'single'
  button: BaseButtonConfig
  loadingText?: string
  minWidth?: string
  className?: string
}

// split button config
interface SplitButtonProps {
  type: 'split'
  mainButton: BaseButtonConfig
  menuItems: MenuItemConfig[]
  loadingText?: string
  menuWidth?: string
  className?: string
  mainButtonClassName?: string
  dropdownButtonClassName?: string
}

type xButtonProps = SingleButtonProps | SplitButtonProps

export function XButton(props: xButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // click outside to close menu
  useEffect(() => {
    if (props.type === 'split') {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setMenuOpen(false)
        }
      }

      if (menuOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [menuOpen, props.type])

  // handle button click
  const handleButtonClick = async (onClick: () => void | Promise<void>) => {
    if (isLoading) return

    setIsLoading(true)
    try {
      await onClick()
    } catch (error) {
      console.error('Button click error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // base style class
  const baseButtonClass = "flex items-center justify-center px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-white text-sm font-semibold transition-colors hover:bg-neutral-300 dark:hover:bg-neutral-700"
  const disabledClass = "opacity-60 cursor-not-allowed"

  if (props.type === 'single') {
    const { button, loadingText, minWidth = 'min-w-[110px]', className = '' } = props
    const isDisabled = button.disabled || isLoading
    // loadingText: props.loadingText > button.text > 'Loading...'
    const actualLoadingText = loadingText || button.text?.trim() || 'Loading...'

    return (
      <button
        onClick={() => handleButtonClick(button.onClick)}
        disabled={isDisabled}
        className={`${minWidth} ${baseButtonClass} rounded-full ${isDisabled ? disabledClass : ''} ${className}`}
        title={button.text}
      >
        {isLoading ? (
          <>
            <icons.Loader2 className="w-5 h-5 mr-1 animate-spin" />
            <span>{actualLoadingText}</span>
          </>
        ) : (
          <>
            {button.icon}
            <span>{button.text}</span>
          </>
        )}
      </button>
    )
  }

  // Split button
  const { mainButton, menuItems, loadingText, menuWidth = 'w-40', className = '', mainButtonClassName = '', dropdownButtonClassName = '' } = props
  const isMainDisabled = mainButton.disabled || isLoading
  // loadingText 优先级：props.loadingText > mainButton.text > 'Loading...'
  const actualLoadingText = loadingText || mainButton.text?.trim() || 'Loading...'

  return (
    <div className={`relative flex bg-neutral-200 dark:bg-neutral-800 rounded-full ${className}`}>
      {/* left main button */}
      <button
        onClick={() => handleButtonClick(mainButton.onClick)}
        disabled={isMainDisabled}
        className={`flex-1 ${baseButtonClass} rounded-l-full ${isMainDisabled ? disabledClass : ''} ${mainButtonClassName}`}
        onMouseDown={e => { if (e.button === 2) e.preventDefault() }}
        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
      >
        {isLoading ? (
          <>
            <icons.Loader2 className="w-5 h-5 mr-1 animate-spin" />
            <span>{actualLoadingText}</span>
          </>
        ) : (
          <>
            {mainButton.icon}
            <span>{mainButton.text}</span>
          </>
        )}
      </button>

      {/* right dropdown button */}
      <span
        className={`flex items-center justify-center w-10 py-2 cursor-pointer transition hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded-r-full ${dropdownButtonClassName}`}
        onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
        tabIndex={0}
        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
      >
        <icons.ChevronDown className="w-6 h-6" />
      </span>

      {/* dropdown menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className={`absolute right-0 top-full ${menuWidth} bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white text-sm rounded-xl shadow-lg z-50 border border-neutral-200 dark:border-neutral-700 overflow-hidden animate-fade-in`}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                handleButtonClick(item.onClick)
                setMenuOpen(false)
              }}
              disabled={item.disabled}
              className={`flex items-center w-full px-4 py-3 transition hover:bg-neutral-300 dark:hover:bg-neutral-600 text-left relative ${item.disabled ? disabledClass : ''}`}
              style={item.splitTopBorder ? { borderTop: '1px solid #AC62FD' } : undefined}
            >
              <span className="flex items-center">
                {item.icon}
                <span>{item.text}</span>
              </span>
              {item.tag && (
                <span
                  className="absolute right-3 top-1 text-[10px] font-semibold"
                  style={{ color: item.tag.color || '#A855F7', pointerEvents: 'none' }}
                >
                  {item.tag.text}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}