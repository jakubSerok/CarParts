import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";

const Chat = () => {
  const { token, userId } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const fetchConversations = async () => {
    try {
      const response = await api.get("/chat/conversations");
      setConversations(response.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await api.get(
        `/chat/conversations/${conversationId}/messages`
      );
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/chat/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !socket) return;

    try {
      socket.emit("message:send", {
        conversationId: activeConversation._id,
        content: newMessage,
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const createConversation = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const response = await api.post("/chat/conversations", {
        participantIds: selectedUsers,
      });

      setConversations([response.data, ...conversations]);
      setActiveConversation(response.data);
      setShowNewConversation(false);
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getConversationName = (conversation) => {
    if (conversation.title) return conversation.title;

    return conversation.participants
      .filter((p) => p._id !== localStorage.getItem("userId"))
      .map((p) => `${p.firstName} ${p.lastName}`)
      .join(", ");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!token) return;

    const socketInstance = io(
      process.env.REACT_APP_API_URL || "http://localhost:4000",
      {
        auth: { token },
      }
    );

    socketInstance.on("connect", () => {
      console.log("Socket connected");
      socketInstance.emit("join:conversations");
    });

    socketInstance.on("users:online", (users) => {
      setOnlineUsers(users);
    });

    socketInstance.on("message:received", (message) => {
      setMessages((prevMessages) => {
        if (prevMessages.some((m) => m._id === message._id)) {
          return prevMessages;
        }
        return [...prevMessages, message];
      });

      if (
        activeConversation &&
        message.conversation === activeConversation._id
      ) {
        socketInstance.emit("messages:read", {
          conversationId: activeConversation._id,
        });
      }
    });

    socketInstance.on("notification:message", ({ conversationId, message }) => {
      fetchConversations();
    });

    socketInstance.on("user:typing", ({ conversationId, userId }) => {
      if (activeConversation && activeConversation._id === conversationId) {
        setTypingUsers((prev) => ({ ...prev, [userId]: true }));
      }
    });

    socketInstance.on("user:stop-typing", ({ conversationId, userId }) => {
      if (activeConversation && activeConversation._id === conversationId) {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }
    });

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);

      if (socket) {
        socket.emit("messages:read", {
          conversationId: activeConversation._id,
        });
      }
    }
  }, [activeConversation]);

  useEffect(() => {
    if (showNewConversation) {
      fetchUsers();
    }
  }, [showNewConversation]);

  const handleTyping = () => {
    if (!socket || !activeConversation) return;

    socket.emit("user:typing", { conversationId: activeConversation._id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("user:stop-typing", {
        conversationId: activeConversation._id,
      });
    }, 2000);
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r border-gray-300 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-300 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Wiadomości</h2>
          <button
            onClick={() => setShowNewConversation(true)}
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Brak konwersacji. Rozpocznij nową rozmowę.
          </div>
        ) : (
          <ul>
            {conversations.map((conversation) => (
              <li
                key={conversation._id}
                onClick={() => setActiveConversation(conversation)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 ${
                  activeConversation?._id === conversation._id
                    ? "bg-gray-100"
                    : ""
                }`}
              >
                <div className="font-medium">
                  {getConversationName(conversation)}
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {new Date(conversation.lastMessage).toLocaleDateString()}
                  </div>
                  {conversation.participants.map(
                    (p) =>
                      isUserOnline(p._id) &&
                      p._id !== userId && (
                        <div
                          key={p._id}
                          className="h-2 w-2 bg-green-500 rounded-full"
                          title="Online"
                        ></div>
                      )
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="w-2/3 flex flex-col">
        {activeConversation ? (
          <>
            <div className="p-4 border-b border-gray-300 bg-white">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  {getConversationName(activeConversation)}
                </h3>
                <div className="flex items-center space-x-2">
                  {activeConversation.participants.map(
                    (p) =>
                      p._id !== userId && (
                        <div key={p._id} className="flex items-center">
                          <span className="text-sm mr-1">{p.firstName}</span>
                          <div
                            className={`h-2 w-2 rounded-full ${
                              isUserOnline(p._id)
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                            title={isUserOnline(p._id) ? "Online" : "Offline"}
                          ></div>
                        </div>
                      )
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`mb-4 flex ${
                    message.sender._id === localStorage.getItem("userId")
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      message.sender._id === localStorage.getItem("userId")
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-200 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div
                      className={`text-xs mt-1 ${
                        message.sender._id === localStorage.getItem("userId")
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(typingUsers).length > 0 && (
                <div className="flex items-center text-gray-500 text-sm mb-2">
                  <div className="flex space-x-1 mr-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                  <span>Pisanie...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={sendMessage}
              className="p-4 border-t border-gray-300 bg-white"
            >
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleTyping}
                  placeholder="Napisz wiadomość..."
                  className="flex-1 border border-gray-300 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 rounded-r-lg hover:bg-blue-600"
                >
                  Wyślij
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <p>Wybierz konwersację lub rozpocznij nową</p>
            </div>
          </div>
        )}
      </div>

      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Nowa konwersacja</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wybierz użytkowników
              </label>
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="p-2 border-b border-gray-200 flex items-center"
                  >
                    <input
                      type="checkbox"
                      id={`user-${user._id}`}
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleUserSelection(user._id)}
                      className="mr-2"
                    />
                    <label htmlFor={`user-${user._id}`} className="flex-1">
                      {user.firstName} {user.lastName} (
                      {user.role === "admin" ? "Admin" : "Użytkownik"})
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowNewConversation(false)}
                className="mr-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Anuluj
              </button>
              <button
                onClick={createConversation}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={selectedUsers.length === 0}
              >
                Rozpocznij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
