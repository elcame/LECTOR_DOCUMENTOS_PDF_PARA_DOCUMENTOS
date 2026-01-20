import { useState } from 'react'
import { validateForm } from '../utils/validation'

/**
 * Hook para manejo de formularios con validación
 * @param {Object} initialValues - Valores iniciales del formulario
 * @param {Object} validationRules - Reglas de validación por campo
 * @returns {Object} - { values, errors, touched, handleChange, handleBlur, handleSubmit, reset }
 */
export const useForm = (initialValues, validationRules = {}) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    
    // Limpiar error si existe
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    
    // Validar campo
    if (validationRules && validationRules[name]) {
      const fieldRules = validationRules[name]
      for (const rule of fieldRules) {
        let error = null
        
        if (typeof rule === 'function') {
          error = rule(values[name])
        } else if (typeof rule === 'object' && rule.validator) {
          error = rule.validator(values[name], values)
        }
        
        if (error) {
          setErrors((prev) => ({ ...prev, [name]: error }))
          break
        }
      }
    }
  }

  const handleSubmit = (onSubmit) => (e) => {
    e.preventDefault()
    
    if (validationRules && Object.keys(validationRules).length > 0) {
      const validation = validateForm(values, validationRules)
      setErrors(validation.errors)
      
      if (!validation.isValid) {
        // Marcar todos los campos como touched
        const allTouched = {}
        Object.keys(values).forEach((key) => {
          allTouched[key] = true
        })
        setTouched(allTouched)
        return
      }
    }
    
    onSubmit(values)
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  const setFieldValue = (name, value) => {
    handleChange(name, value)
  }

  const setFieldError = (name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
    isValid: Object.keys(errors).length === 0,
  }
}
