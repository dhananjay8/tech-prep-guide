# Build a Real-time Chat UI

## Requirements
- Send and receive messages in real-time
- Show message list (scroll to latest), typing indicator
- Online/offline status, timestamps
- WebSocket or polling for real-time updates

## Data Model
```javascript
const message = {
  id: 'msg-1',
  senderId: 'user-1',
  text: 'Hello!',
  timestamp: Date.now(),
  status: 'sent' // sent | delivered | read
};
```

## Core Implementation

```javascript
function ChatUI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const ws = useRef(null);
  const typingTimer = useRef(null);

  // WebSocket connection
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080/chat');
    ws.current = socket;
    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        // The server echoes the client-generated ID, making optimistic sends idempotent.
        setMessages(prev => prev.some(message => message.id === data.message.id)
          ? prev
          : [...prev, data.message]);
      } else if (data.type === 'typing') {
        setIsTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setIsTyping(false), 2000);
      }
    };
    return () => {
      clearTimeout(typingTimer.current);
      socket.close();
      ws.current = null;
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || ws.current?.readyState !== WebSocket.OPEN) return;
    const msg = { id: crypto.randomUUID(), senderId: 'me', text, timestamp: Date.now() };
    ws.current.send(JSON.stringify({ type: 'message', message: msg }));
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={msg.senderId === 'me' ? 'sent' : 'received'}>
            <p>{msg.text}</p>
            <span className="time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
        {isTyping && <div className="typing">User is typing...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <input value={input} onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
```

## Key Patterns
- **WebSocket** for real-time bidirectional communication
- **Optimistic UI**: Show sent message immediately, update status on server ack
- **Auto-scroll**: ScrollIntoView on new message
- **Typing indicator**: Debounced typing event

## Interview Tips
- Discuss WebSocket vs polling vs SSE trade-offs
- Handle reconnection on WebSocket disconnect
- Message ordering and deduplication
- Virtualize message list for long conversations
- Do not send until the socket is open; show reconnecting/offline state and retry safely.
- Keep the client message ID through server acknowledgement to avoid duplicate optimistic and echoed messages.
- Scroll only when the user is already near the bottom; do not pull them away from older messages.
