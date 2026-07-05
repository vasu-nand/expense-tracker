'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

interface FileUploadProps {
    onUploadStatus: (status: string) => void
    month: string
}

export function FileUpload({ onUploadStatus, month }: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0])
            onUploadStatus('')
        }
    }, [onUploadStatus])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv'],
            'application/json': ['.json']
        },
        maxFiles: 1
    })

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('month', month)

        try {
            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            onUploadStatus(`Successfully uploaded ${response.data.count} expenses for ${month}`)
            setFile(null)
            
            // Dispatch standard reload event
            window.dispatchEvent(new CustomEvent('expense-added'))
        } catch (error: any) {
            onUploadStatus(`Error: ${error.response?.data?.error || 'Upload failed'}`)
        } finally {
            setUploading(false)
        }
    }

    const removeFile = () => {
        setFile(null)
        onUploadStatus('')
    }

    const getFileIcon = () => {
        if (!file) return <Upload className="h-12 w-12 text-muted-foreground" />
        if (file.name.endsWith('.csv')) return <FileText className="h-12 w-12 text-blue-500" />
        if (file.name.endsWith('.json')) return <FileText className="h-12 w-12 text-amber-500" />
        return <FileSpreadsheet className="h-12 w-12 text-green-500" />
    }

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25",
                    file && "border-green-500 bg-green-50 dark:bg-green-950/20"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-2">
                    {getFileIcon()}
                    {file ? (
                        <div className="flex items-center space-x-2">
                            <span className="font-medium">{file.name}</span>
                            <span className="text-sm text-muted-foreground">
                                ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removeFile()
                                }}
                                className="p-1 hover:bg-muted rounded-full"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="font-medium">Drop your statement here or click to browse</p>
                            <p className="text-sm text-muted-foreground">
                                Supports .xlsx, .xls, .csv, .json
                            </p>
                        </>
                    )}
                </div>
            </div>

            {file && (
                <div className="flex justify-end">
                    <Button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full md:w-auto bg-custom-btn-gradient text-white font-bold"
                    >
                        {uploading ? 'Uploading...' : 'Upload File'}
                    </Button>
                </div>
            )}
        </div>
    )
}