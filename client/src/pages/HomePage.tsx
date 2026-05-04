import FormComponent from "@/components/forms/FormComponent"

function HomePage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-dark">
            <div className="flex w-full max-w-6xl flex-col items-center justify-between gap-12 p-8 lg:flex-row">
                <div className="flex w-full flex-col items-center justify-center text-center lg:w-1/2 lg:items-start lg:text-left">
                    <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
                        Welcome to <span className="text-primary">CloudEdit</span>
                    </h1>
                    <p className="max-w-lg text-lg text-gray-400">
                        A powerful, cloud-based collaborative code editor. Code, chat, and draw in real-time with your peers.
                    </p>
                </div>
                <div className="flex w-full justify-center lg:w-1/2">
                    <FormComponent />
                </div>
            </div>
        </div>
    )
}

export default HomePage
