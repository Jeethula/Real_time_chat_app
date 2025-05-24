import { FiMessageSquare } from "react-icons/fi";

export default function ChatPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <div className="rounded-full bg-gray-100 p-6 mb-4">
        <FiMessageSquare className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-medium mb-2">Your Messages</h3>
      <p className="text-muted-foreground max-w-sm">
        Select a chat from the sidebar to start messaging or create a new chat to connect with someone.
      </p>
    </div>
  );
}