interface Language {
    id: number
    name: string
}

interface RunContext {
    setInput: (input: string) => void
    output: string
    isRunning: boolean
    supportedLanguages: Language[]
    selectedLanguage: Language
    setSelectedLanguage: (language: Language) => void
    runCode: () => void
}

export { Language, RunContext }
