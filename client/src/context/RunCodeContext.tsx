import axiosInstance from "@/api/executionApi"
import { Language, RunContext as RunContextType } from "@/types/run"
import {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useState,
} from "react"
import toast from "react-hot-toast"
import { useFileSystem } from "./FileContext"

const RunCodeContext = createContext<RunContextType | null>(null)

export const useRunCode = () => {
    const context = useContext(RunCodeContext)
    if (context === null) {
        throw new Error(
            "useRunCode must be used within a RunCodeContextProvider",
        )
    }
    return context
}

const RunCodeContextProvider = ({ children }: { children: ReactNode }) => {
    const { activeFile } = useFileSystem()
    const [input, setInput] = useState<string>("")
    const [output, setOutput] = useState<string>("")
    const [isRunning, setIsRunning] = useState<boolean>(false)
    const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([])
    const [selectedLanguage, setSelectedLanguage] = useState<Language>({
        id: 0,
        name: "",
    })

    useEffect(() => {
        const fetchSupportedLanguages = async () => {
            try {
                const languages = await axiosInstance.get("/languages")
                setSupportedLanguages(languages.data)
            } catch (error: any) {
                toast.error("Failed to fetch supported languages")
                if (error?.response?.data) console.error(error?.response?.data)
            }
        }

        fetchSupportedLanguages()
    }, [])

    // Map file extensions to Judge0 language name keywords
    const extToLangKeyword: Record<string, string> = {
        js: "javascript",
        ts: "typescript",
        py: "python",
        c: "c (",
        cpp: "c++ (",
        h: "c (",
        hpp: "c++ (",
        java: "java (",
        cs: "c# ",
        go: "go (",
        rs: "rust",
        rb: "ruby",
        php: "php",
        swift: "swift",
        kt: "kotlin",
        scala: "scala",
        r: "r (",
        lua: "lua",
        pl: "perl",
        sh: "bash",
        sql: "sql",
        dart: "dart",
        hs: "haskell",
        pas: "pascal",
        f90: "fortran",
        bas: "basic",
    }

    // Set the selected language based on the file extension
    useEffect(() => {
        if (supportedLanguages.length === 0 || !activeFile?.name) return

        const extension = activeFile.name.split(".").pop()?.toLowerCase()
        if (extension && extToLangKeyword[extension]) {
            const keyword = extToLangKeyword[extension]
            // Find the best matching language (prefer latest version)
            const matches = supportedLanguages.filter((lang) =>
                lang.name.toLowerCase().includes(keyword.toLowerCase())
            )
            if (matches.length > 0) {
                // Pick the last match (usually the latest version)
                setSelectedLanguage(matches[matches.length - 1])
            }
        } else {
            setSelectedLanguage({ id: 0, name: "" })
        }
    }, [activeFile?.name, supportedLanguages])

    const runCode = async () => {
        try {
            if (!selectedLanguage || selectedLanguage.id === 0) {
                return toast.error("Please select a language to run the code")
            } else if (!activeFile) {
                return toast.error("Please open a file to run the code")
            } else {
                toast.loading("Running code...")
            }

            setIsRunning(true)
            const encodeBase64 = (str: string) => btoa(unescape(encodeURIComponent(str || "")))
            const decodeBase64 = (str: string) => {
                if (!str) return ""
                try {
                    return decodeURIComponent(escape(atob(str)))
                } catch {
                    return atob(str)
                }
            }

            const response = await axiosInstance.post("/submissions?base64_encoded=true&wait=true", {
                language_id: selectedLanguage.id,
                source_code: encodeBase64(activeFile.content || ""),
                stdin: encodeBase64(input),
            })
            if (response.data.compile_output) {
                setOutput(decodeBase64(response.data.compile_output))
            } else if (response.data.stderr) {
                setOutput(decodeBase64(response.data.stderr))
            } else if (response.data.stdout) {
                setOutput(decodeBase64(response.data.stdout))
            } else {
                setOutput(response.data.status?.description || "")
            }
            setIsRunning(false)
            toast.dismiss()
        } catch (error: any) {
            console.error(error?.response?.data || error)
            setIsRunning(false)
            toast.dismiss()
            toast.error("Failed to run the code")
        }
    }

    return (
        <RunCodeContext.Provider
            value={{
                setInput,
                output,
                isRunning,
                supportedLanguages,
                selectedLanguage,
                setSelectedLanguage,
                runCode,
            }}
        >
            {children}
        </RunCodeContext.Provider>
    )
}

export { RunCodeContextProvider }
export default RunCodeContext
