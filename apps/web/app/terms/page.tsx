export default function TermsPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-md text-center">
                <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
                <p className="text-gray-600">
                    This is a demo application for the LifeBridge hackathon project.
                    Actual terms of service would go here.
                </p>
                <a href="/" className="block mt-6 text-blue-600 hover:underline">Return Home</a>
            </div>
        </div>
    );
}
