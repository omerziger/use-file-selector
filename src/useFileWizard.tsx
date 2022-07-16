import { useCallback, useRef, useState } from 'react'
import { useFileInput } from './'
import { decodeAudioFile } from './utils'
import { WizardFile } from './types'

export interface UseFileWizardProps {
  type: 'audio' | 'image' | 'video' | 'document'
  onLoadEnd?: (wizardFile: WizardFile) => any
  preview?: boolean
}

export function useFileWizard(props: UseFileWizardProps) {
  const { type, onLoadEnd, preview } = props
  const [loading, setLoading] = useState<boolean>(false)
  const [file, setFile] = useState<WizardFile | null>()
  const [filePreview, setFilePreview] = useState<string | null>()
  const fileReader = useRef<FileReader>(new FileReader())

  const handleInputChange = useCallback((e: Event) => {
    const currentFileReader = fileReader.current
    const readersFile = (e.target as HTMLInputElement).files![0]

    currentFileReader.onloadstart = () => setLoading(true)
    currentFileReader.onloadend = () => handleReaderLoad(readersFile)
    currentFileReader.readAsArrayBuffer(readersFile)
  }, [fileReader.current])

  const fileInput = useFileInput({
    type: type !== 'document' ? type : null,
    onChange: handleInputChange,
  })

  const handleReaderLoad = useCallback((readerFile: File) => {
    const readerDecode = fileReader.current.result as ArrayBuffer

    switch (type) {
      case 'audio':
      case 'video':
        const handleDecodeSuccess: DecodeSuccessCallback = (dd: AudioBuffer) => {
          const file = { readerFile, readerDecode, audioData: dd }
          setFile(file)
          setLoading(false)
          onLoadEnd?.(file)
        }
        decodeAudioFile(readerDecode as ArrayBuffer, handleDecodeSuccess)
        break
      case 'image':
        const file = { readerFile, readerDecode }
        setFile(file)
        setLoading(false)
        preview && setFilePreview(URL.createObjectURL(readerFile))
        onLoadEnd?.(file)
    }
  }, [])

  return {
    file,
    filePreview,
    loading,
    click: () => fileInput.current.click(),
    clear: () => {
      fileInput.current.value = ''
      fileReader.current.onload = null
      setFile(null)
      setFilePreview(null)
      setLoading(false)
    },
  }
}
