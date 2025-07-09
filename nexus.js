// ============================================================================
// ENHANCED NEXUS AI ASSISTANT
// Modern, feature-rich AI chat application with advanced enhancements
// ============================================================================

/**
 * Core Application Class
 * Manages the entire NEXUS AI Assistant application with advanced features
 */
class NexusAI {
  /**
   * Attach event listeners to all .copy-code-btn buttons in code blocks
   */
  addCodeBlockCopyListeners() {
    document.querySelectorAll('.copy-code-btn').forEach(copyBtn => {
      // Remove previous listener by replacing with clone
      const newBtn = copyBtn.cloneNode(true);
      copyBtn.parentNode.replaceChild(newBtn, copyBtn);
      newBtn.addEventListener('click', async () => {
        try {
          // Find the nearest code block and code content
          const codeBlock = newBtn.closest('.code-block');
          const codeElem = codeBlock?.querySelector('.code-content code');
          if (!codeElem) throw new Error('Code element not found');
          const codeText = codeElem.innerText;
          await navigator.clipboard.writeText(codeText);
          // Visual feedback
          const iconSpan = newBtn.querySelector('span');
          if (iconSpan) iconSpan.textContent = 'check';
          newBtn.classList.add('success');
          setTimeout(() => {
            if (iconSpan) iconSpan.textContent = 'content_copy';
            newBtn.classList.remove('success');
          }, 2000);
        } catch (err) {
          this.showToast('Failed to copy code', 'error');
        }
      });
    });
  }

  constructor() {
    // Core elements
    this.chatInput = document.querySelector("#text-input")
    this.sendButton = document.querySelector("#send-btn")
    this.chatContainer = document.querySelector(".chat-container")
    this.deleteButton = document.querySelector("#delete-btn")
    this.lightButton = document.querySelector("#light-btn")

    // State management
    this.currentChatId = null
    this.chatHistory = {}
    this.currentPersonality = "professional"
    this.currentModel = "gemini"
    this.sessionStartTime = Date.now()
    this.sessionTimer = null
    this.memoryEnabled = true
    this.isProcessing = false
    this.messageCount = 0

    // --- Analytics Enhancement Start ---
    // Enhanced analytics tracking
    this.analytics = {
      sessionStart: Date.now(),
      messagesSent: 0,
      totalCharacters: 0,
      totalWords: 0,
      responseTimes: [],
      averageResponseTime: 0,
    }
    // --- Analytics Enhancement End ---

    // --- Voice Enhancement Start ---
    // Voice input enhancements
    this.voiceRecognition = null
    this.isListening = false
    this.speechTranscript = ""
    // --- Voice Enhancement End ---

    // Check for voice recognition support at construction
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setTimeout(() => {
        this.showToast('Voice recognition is not supported in your browser.', 'warning');
      }, 1000);
    }

    // --- Chat Enhancement Start ---
    // Chat enhancement features
    this.pinnedMessages = new Set()
    this.replyToMessage = null
    this.selectedSuggestionIndex = -1
    // --- Chat Enhancement End ---

    // Configuration
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      maxTokens: 4000,
      streamingEnabled: true,
      autoSave: true,
      autoSaveInterval: 5 * 60 * 1000, // 5 minutes
    }

    // Storage keys
    this.storageKeys = {
      CHAT_HISTORY: "nexus_chat_history",
      PERSONALITY: "nexus_personality",
      MODEL: "nexus_current_model",
      MEMORY: "nexus_memory_enabled",
      SETTINGS: "nexus_settings",
      API_KEYS: "nexus_api_keys",
      ANALYTICS: "nexus_analytics",
      PINNED_MESSAGES: "nexus_pinned_messages",
    }

    // API configurations
    this.apiConfigs = {
      gemini: {
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        key: "AIzaSyB0Cti2NvWqocnx6huDV7G8i_K8lOmiSzU",
        streaming: false,
      },
      gpt4: {
        url: "https://api.openai.com/v1/chat/completions",
        key: null,
        streaming: true,
      },
      claude: {
        url: "https://api.anthropic.com/v1/messages",
        key: null,
        streaming: true,
      },
    }

    // Personality configurations
    this.personalities = {
      professional: {
        name: "Professional",
        systemPrompt:
          "You are NEXUS, a professional AI assistant. Respond in a formal, precise, and business-oriented manner. Use clear, concise language and provide structured, actionable information.",
        greeting:
          "Greetings. I'm NEXUS, your professional AI assistant. How may I assist you with your business needs today?",
      },
      friendly: {
        name: "Friendly",
        systemPrompt:
          "You are NEXUS, a friendly and approachable AI assistant. Use warm, casual language and be conversational. Show enthusiasm and empathy in your responses.",
        greeting:
          "Hey there! I'm NEXUS, your friendly AI companion. I'm excited to help you out today! What can we work on together?",
      },
      sarcastic: {
        name: "Sarcastic",
        systemPrompt:
          "You are NEXUS, a witty and slightly sarcastic AI assistant. Use humor, clever remarks, and playful sarcasm while still being helpful. Keep it light and entertaining.",
        greeting:
          "Well, well, well... Look who's back for more of my brilliant insights. I'm NEXUS, and I suppose I can spare some time to help you out. What's the situation?",
      },
      creative: {
        name: "Creative",
        systemPrompt:
          "You are NEXUS, a creative and imaginative AI assistant. Think outside the box, use vivid language, and approach problems with artistic flair. Be inspiring and innovative in your responses.",
        greeting:
          "Welcome to the realm of infinite possibilities! I'm NEXUS, your creative companion. Let's paint some ideas together and bring your imagination to life!",
      },
    }

    // --- Smart Autocomplete Enhancement Start ---
    // Enhanced command system with usage examples
    this.commands = {
      "/help": {
        description: "Show available commands",
        usage: "/help [command]",
        example: "/help export",
        execute: (args) => this.showHelp(args),
      },
      "/clear": {
        description: "Clear the current chat",
        usage: "/clear",
        example: "/clear",
        execute: () => this.clearChat(),
      },
      "/export": {
        description: "Export chat in various formats",
        usage: "/export [format]",
        example: "/export pdf → Export to PDF",
        execute: (args) => this.exportChat(args[0] || "markdown"),
      },
      "/model": {
        description: "Switch AI model",
        usage: "/model [gemini|gpt4|claude]",
        example: "/model gpt4 → Switch to GPT-4",
        execute: (args) => this.switchModel(args[0]),
      },
      "/personality": {
        description: "Change personality mode",
        usage: "/personality [professional|friendly|sarcastic|creative]",
        example: "/personality friendly → Switch to friendly mode",
        execute: (args) => this.switchPersonality(args[0]),
      },
      "/code": {
        description: "Execute code",
        usage: "/code [language] [code]",
        example: "/code js console.log('Hello')",
        execute: (args) => this.executeCode(args[0], args.slice(1).join(" ")),
      },
      "/summarize": {
        description: "Summarize current chat",
        usage: "/summarize",
        example: "/summarize → Get chat summary",
        execute: () => this.summarizeChat(),
      },
      "/pin": {
        description: "Pin the last message",
        usage: "/pin",
        example: "/pin → Pin last message",
        execute: () => this.pinLastMessage(),
      },
    }

    // Most used commands tracking
    this.commandUsage = {}
    // --- Smart Autocomplete Enhancement End ---

    // Template system
    this.templates = {
      coding: [
        {
          title: "Debug Code",
          description: "Help debug and fix code issues",
          prompt:
            "I have a bug in my code. Can you help me debug and fix it?\n\n```\n[Paste your code here]\n```\n\nThe issue I'm experiencing is: [Describe the problem]",
        },
        {
          title: "Code Review",
          description: "Get a comprehensive code review",
          prompt:
            "Please review this code for best practices, performance, and potential improvements:\n\n```\n[Paste your code here]\n```",
        },
        {
          title: "Algorithm Explanation",
          description: "Explain complex algorithms",
          prompt:
            "Can you explain how this algorithm works and provide a step-by-step breakdown?\n\n```\n[Paste algorithm here]\n```",
        },
      ],
      writing: [
        {
          title: "Email Draft",
          description: "Draft professional emails",
          prompt:
            "Help me write a professional email for:\n\nTo: [Recipient]\nSubject: [Subject]\nPurpose: [What you want to achieve]\nTone: [Professional/Friendly/Formal]\n\nKey points to include:\n- [Point 1]\n- [Point 2]\n- [Point 3]",
        },
        {
          title: "Content Outline",
          description: "Create structured content outlines",
          prompt:
            "Create a detailed outline for content about:\n\nTopic: [Your topic]\nTarget audience: [Describe audience]\nContent type: [Blog post/Article/Guide]\nKey objectives: [What should readers learn/do]",
        },
        {
          title: "Creative Writing",
          description: "Generate creative writing prompts",
          prompt:
            "Help me with creative writing:\n\nGenre: [Fantasy/Sci-fi/Mystery/etc.]\nSetting: [Describe the world/location]\nMain character: [Brief description]\nConflict/Challenge: [What's the main problem]\n\nPlease provide either a story outline or opening paragraphs.",
        },
      ],
      analysis: [
        {
          title: "Data Analysis",
          description: "Analyze data and provide insights",
          prompt:
            "Analyze this data and provide insights:\n\n[Paste your data or describe the dataset]\n\nSpecific questions I want answered:\n1. [Question 1]\n2. [Question 2]\n3. [Question 3]\n\nPlease include trends, patterns, and actionable recommendations.",
        },
        {
          title: "Competitive Analysis",
          description: "Compare competitors or alternatives",
          prompt:
            "Help me analyze and compare:\n\nOption A: [Description]\nOption B: [Description]\nOption C: [Description]\n\nCriteria for comparison:\n- [Criterion 1]\n- [Criterion 2]\n- [Criterion 3]\n\nPlease provide a detailed comparison with pros/cons and recommendations.",
        },
        {
          title: "Problem Solving",
          description: "Structured problem-solving approach",
          prompt:
            "Help me solve this problem using a structured approach:\n\nProblem: [Describe the problem clearly]\nContext: [Background information]\nConstraints: [Any limitations or requirements]\nGoal: [What success looks like]\n\nPlease provide a step-by-step solution with alternatives.",
        },
      ],
    }

    // Plugin system
    this.plugins = new Map()

    // Add to constructor after other properties
    this.userProfile = {
      name: "User",
      image: "/images/user-default.png",
    }

    // Initialize the application
    this.init()
  }

  /**
   * Initialize the application with enhanced features
   */
  async init() {
    try {
      // Load saved settings
      await this.loadSettings()

      // Initialize core features
      this.initializeSessionTimer()
      this.initializeEventListeners()
      this.initializeKeyboardShortcuts()
      this.initializeDragAndDrop()
      this.initializeVoiceInput()
      this.initializeFileUpload()
      this.initializeAutocomplete()
      this.initializeCommandSystem()
      this.initializePlugins()

      // --- Enhanced Features Start ---
      this.initializeFloatingButtons()
      this.initializeModalDragging()
      this.initializeMessagePreview()
      this.initializeThemeSystem()
      // --- Enhanced Features End ---

      // Add to init method after other initializations
      this.initializeUserProfile()

      // Load chat history
      this.loadChatHistory()

      // Setup theme
      this.setupTheme()

      // Initialize first chat if needed
      if (Object.keys(this.chatHistory).length === 0) {
        this.createNewChat()
        setTimeout(() => {
          const greeting = this.personalities[this.currentPersonality].greeting
          this.displayBotMessage(greeting, false)
        }, 500)
      } else {
        // Load most recent chat
        const mostRecentChatId = Object.keys(this.chatHistory).sort(
          (a, b) => this.chatHistory[b].timestamp - this.chatHistory[a].timestamp,
        )[0]
        this.loadChat(mostRecentChatId)
      }

      // Update UI
      this.updateUI()
      this.displaySavedChats()

      // Setup auto-save
      if (this.config.autoSave) {
        setInterval(() => this.autoSave(), this.config.autoSaveInterval)
      }

      // Show welcome notification
      this.showToast("NEXUS AI Assistant loaded successfully!", "success")
    } catch (error) {
      console.error("Failed to initialize NEXUS:", error)
      this.showToast("Failed to initialize application", "error")
    }
  }

  /**
   * Initialize enhanced session timer with analytics
   */
  initializeSessionTimer() {
    const timerDisplay = document.getElementById("timer-display")
    const messageCountDisplay = document.getElementById("message-count")

    if (!timerDisplay) return

    this.sessionTimer = setInterval(() => {
      const elapsed = Date.now() - this.sessionStartTime
      const hours = Math.floor(elapsed / 3600000)
      const minutes = Math.floor((elapsed % 3600000) / 60000)
      const seconds = Math.floor((elapsed % 60000) / 1000)

      if (hours > 0) {
        timerDisplay.textContent = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      } else {
        timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      }

      if (messageCountDisplay) {
        messageCountDisplay.textContent = this.messageCount.toString()
      }

      // Update analytics
      this.analytics.sessionDuration = elapsed
    }, 1000)
  }

  /**
   * Initialize enhanced event listeners
   */
  initializeEventListeners() {
    // Send button
    this.sendButton?.addEventListener("click", () => this.handleSendMessage())

    // Enter key to send
    this.chatInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        this.handleSendMessage()
      }

      // --- Accessibility Enhancement Start ---
      // Arrow key navigation for suggestions
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        this.handleSuggestionNavigation(e)
      }

      if (e.key === "Enter" && this.selectedSuggestionIndex >= 0) {
        e.preventDefault()
        this.selectSuggestion()
      }

      if (e.key === "Escape") {
        this.hideSuggestions()
      }
      // --- Accessibility Enhancement End ---
    })

    // Auto-resize textarea and update chat padding
    this.chatInput.addEventListener("input", () => {
      this.chatInput.style.height = "auto";
      this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 150) + "px";
      this.updateChatPadding();
      this.scrollToBottom();
    });
    // On window resize, update chat padding and scroll
    window.addEventListener("resize", this.debounce(() => {
      this.updateChatPadding();
      this.scrollToBottom();
    }, 100));
    // Initial call
    this.updateChatPadding();
    // --- End dynamic chat padding ---
    // Auto-resize textarea
    this.chatInput?.addEventListener("input", () => {
      this.chatInput.style.height = "auto"
      this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 150) + "px"
    })

    // Theme toggle
    this.lightButton?.addEventListener("click", () => this.toggleTheme())

    // Clear chat
    this.deleteButton?.addEventListener("click", () => this.clearChat())

    // Export chat
    document.getElementById("export-btn")?.addEventListener("click", () => this.showExportModal())

    // --- Chat Enhancement Start ---
    // Summarize chat
    document.getElementById("summarize-btn")?.addEventListener("click", () => this.summarizeChat())

    // FIXED: Read Aloud Button Event Listener
    document.getElementById("read-btn")?.addEventListener("click", () => {
      const lastBotMessage = this.getLastBotMessage()
      if (lastBotMessage) {
        this.readAloud(lastBotMessage)
      } else {
        this.showToast("No message to read", "warning")
      }
    })
    // --- Chat Enhancement End ---

    // Model selector
    document.getElementById("model-btn")?.addEventListener("click", () => this.showModelModal())

    // Personality selector
    document.getElementById("personality-btn")?.addEventListener("click", () => this.showPersonalityModal())

    // Settings
    document.getElementById("settings-btn")?.addEventListener("click", () => this.showSettingsModal())

    // FIXED: Sidebar toggle
    document.getElementById("toggle-sidebar")?.addEventListener("click", () => this.toggleSidebar())

    // --- Analytics Enhancement Start ---
    // Analytics clickable elements
    document.getElementById("session-timer")?.addEventListener("click", () => this.showAnalyticsModal())
    document.getElementById("analytics-display")?.addEventListener("click", () => this.showAnalyticsModal())
    // --- Analytics Enhancement End ---

    // Memory toggle
    document.getElementById("memory-toggle")?.addEventListener("change", (e) => {
      this.memoryEnabled = e.target.checked
      this.saveSettings()
    })

    // Search chats
    document.getElementById("search-chats")?.addEventListener("input", (e) => {
      this.filterChats(e.target.value)
    })

    // Template buttons
    document.querySelectorAll(".template-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const category = btn.dataset.category
        this.showTemplateModal(category)
      })
    })

    // Modal close handlers
    document.querySelectorAll(".modal-close").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal-overlay")
        this.closeModal(modal)
      })
    })

    // Modal overlay click to close
    document.querySelectorAll(".modal-overlay").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal(modal)
        }
      })
    })

    // Code execution
    document.getElementById("code-execute-btn")?.addEventListener("click", () => this.showCodeModal())

    // Settings tabs
    document.querySelectorAll(".settings-tab").forEach((tab) => {
      tab.addEventListener("click", () => this.switchSettingsTab(tab.dataset.tab))
    })

    // Export buttons
    document.getElementById("export-json")?.addEventListener("click", () => this.exportData("json"))
    document.getElementById("export-markdown")?.addEventListener("click", () => this.exportData("markdown"))
    document.getElementById("export-pdf")?.addEventListener("click", () => this.exportData("pdf"))
    document.getElementById("import-data")?.addEventListener("click", () => this.importData())

    // Attach copy listeners for code blocks
    this.addCodeBlockCopyListeners();


  }



  // Call this when output is generated
  showOutput(outputText) {
    const outputPlaceholder = document.querySelector('.output-placeholder');
    const outputCode = document.querySelector('.output-code-content');
  
    if (outputPlaceholder) outputPlaceholder.style.display = 'none';
    if (outputCode) {
      outputCode.style.display = 'block';
  
      // Update code content
      const codeTag = outputCode.querySelector('code');
      if (codeTag) codeTag.textContent = outputText;

      // Ensure fresh copy button listener
      const oldBtn = outputCode.querySelector('.copy-output-btn');
      if (oldBtn) {
        // WARNING: Cloning removes all event listeners; do NOT keep references to old DOM nodes to avoid memory leaks.
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);

        newBtn.addEventListener('click', async () => {
          try {
            // Find the closest code element (prefer sibling, fallback to first code in output panel)
            let codeElem = newBtn.previousElementSibling;
            if (!(codeElem && codeElem.tagName === 'CODE')) {
              codeElem = outputCode.querySelector('code');
            }
            const codeText = codeElem?.innerText || '';
            if (!codeText.trim()) {
              this.showToast('No output to copy', 'warning');
              return;
            }
            await navigator.clipboard.writeText(codeText);

            const icon = newBtn.querySelector('span');
            if (icon) icon.textContent = 'check';
            newBtn.classList.add('success');

            setTimeout(() => {
              if (icon) icon.textContent = 'content_copy';
              newBtn.classList.remove('success');
            }, 2000);
          } catch (err) {
            this.showToast('Failed to copy output', 'error');
          }
        });
      }
    }
  }
  

  // Call this when output is cleared
  clearOutput() {
    const outputPlaceholder = document.querySelector('.output-placeholder');
    const outputCode = document.querySelector('.output-code-content');
    if (outputPlaceholder) outputPlaceholder.style.display = 'block';
    if (outputCode) {
      outputCode.style.display = 'none';
      const codeTag = outputCode.querySelector('code');
      if (codeTag) codeTag.textContent = '';
    }
  }

  /**
   * Attach event listeners to all .copy-code-btn buttons in code blocks
   * Provides visual feedback (icon and .success class) similar to chat message copy
   */
  addCodeBlockCopyListeners() {
    document.querySelectorAll('.copy-code-btn').forEach(copyBtn => {
      // Remove previous listener by replacing with clone
      const newBtn = copyBtn.cloneNode(true);
      copyBtn.parentNode.replaceChild(newBtn, copyBtn);
      newBtn.addEventListener('click', async () => {
        try {
          // Find the nearest code block and code content
          const codeBlock = newBtn.closest('.code-block');
          const codeElem = codeBlock?.querySelector('.code-content code');
          if (!codeElem) throw new Error('Code element not found');
          const codeText = codeElem.innerText;
          await navigator.clipboard.writeText(codeText);
          // Visual feedback
          const iconSpan = newBtn.querySelector('span');
          if (iconSpan) iconSpan.textContent = 'check';
          newBtn.classList.add('success');
          setTimeout(() => {
            if (iconSpan) iconSpan.textContent = 'content_copy';
            newBtn.classList.remove('success');
          }, 2000);
        } catch (err) {
          this.showToast('Failed to copy code', 'error');
        }
      });
    });
  }

  /**
   * Get the text content of the last bot message
   */
  getLastBotMessage() {
    const botMessages = document.querySelectorAll(".chat-message.incoming .message-text")
    if (botMessages.length > 0) {
      const lastMessage = botMessages[botMessages.length - 1]
      return lastMessage.textContent || lastMessage.innerText
    }
    return null
  }

  // FIXED: Read Aloud Method using Web Speech API
  /**
   * Read text aloud using Web Speech API
   */
  readAloud(text) {
    if (!("speechSynthesis" in window)) {
      this.showToast("Text-to-speech not supported in this browser", "error")
      return
    }

    // Stop any current speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 0.8
    utterance.volume = 0.9

    // Find a suitable voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice =
      voices.find((voice) => voice.lang.includes("en") && !voice.name.toLowerCase().includes("female")) || voices[0]

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => {
      this.showToast("Reading message aloud...", "info")
    }

    utterance.onend = () => {
      this.showToast("Finished reading", "success")
    }

    utterance.onerror = () => {
      this.showToast("Speech synthesis failed", "error")
    }

    window.speechSynthesis.speak(utterance)
  }

  // --- Accessibility Enhancement Start ---
  /**
   * Handle keyboard navigation for suggestions
   */
  handleSuggestionNavigation(e) {
    const suggestionsContainer = document.getElementById("autocomplete-suggestions")
    const commandsContainer = document.getElementById("command-suggestions")

    const activeContainer =
      suggestionsContainer.style.display !== "none"
        ? suggestionsContainer
        : commandsContainer.style.display !== "none"
          ? commandsContainer
          : null

    if (!activeContainer) return

    const items = activeContainer.querySelectorAll(".suggestion-item, .command-item")
    if (items.length === 0) return

    e.preventDefault()

    // Remove previous selection
    items.forEach((item) => item.classList.remove("selected"))

    if (e.key === "ArrowDown") {
      this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, items.length - 1)
    } else if (e.key === "ArrowUp") {
      this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1)
    }

    if (this.selectedSuggestionIndex >= 0) {
      items[this.selectedSuggestionIndex].classList.add("selected")
      items[this.selectedSuggestionIndex].scrollIntoView({ block: "nearest" })
    }
  }

  /**
   * Select the currently highlighted suggestion
   */
  selectSuggestion() {
    const suggestionsContainer = document.getElementById("autocomplete-suggestions")
    const commandsContainer = document.getElementById("command-suggestions")

    const activeContainer =
      suggestionsContainer.style.display !== "none"
        ? suggestionsContainer
        : commandsContainer.style.display !== "none"
          ? commandsContainer
          : null

    if (!activeContainer) return

    const items = activeContainer.querySelectorAll(".suggestion-item, .command-item")
    if (this.selectedSuggestionIndex >= 0 && this.selectedSuggestionIndex < items.length) {
      items[this.selectedSuggestionIndex].click()
    }
  }

  /**
   * Hide all suggestion containers
   */
  hideSuggestions() {
    document.getElementById("autocomplete-suggestions").style.display = "none"
    document.getElementById("command-suggestions").style.display = "none"
    this.selectedSuggestionIndex = -1
  }
  // --- Accessibility Enhancement End ---

  /**
   * Initialize keyboard shortcuts
   */
  initializeKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + Enter to send message
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        this.handleSendMessage()
      }

      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        document.getElementById("search-chats")?.focus()
      }

      // Ctrl/Cmd + N for new chat
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault()
        this.createNewChat()
      }

      // Ctrl/Cmd + / to show help
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault()
        this.showHelp()
      }

      // Escape to close modals
      if (e.key === "Escape") {
        const openModal = document.querySelector(".modal-overlay.active")
        if (openModal) {
          this.closeModal(openModal)
        }
      }
    })
  }

  /**
   * Initialize drag and drop functionality
   */
  initializeDragAndDrop() {
    const dropOverlay = document.getElementById("drag-drop-overlay")
    const mainContent = document.querySelector(".main-content")

    if (!dropOverlay || !mainContent) return

    let dragCounter = 0

    mainContent.addEventListener("dragenter", (e) => {
      e.preventDefault()
      dragCounter++
      dropOverlay.classList.add("active")
    })

    mainContent.addEventListener("dragleave", (e) => {
      e.preventDefault()
      dragCounter--
      if (dragCounter === 0) {
        dropOverlay.classList.remove("active")
      }
    })

    mainContent.addEventListener("dragover", (e) => {
      e.preventDefault()
    })

    mainContent.addEventListener("drop", (e) => {
      e.preventDefault()
      dragCounter = 0
      dropOverlay.classList.remove("active")

      const files = Array.from(e.dataTransfer.files)
      this.handleFileUpload(files)
    })
  }

  /**
   * Initialize enhanced voice input with real-time transcript
   */
  initializeVoiceInput() {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.log("Speech recognition not supported")
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.voiceRecognition = new SpeechRecognition()

    this.voiceRecognition.continuous = true
    this.voiceRecognition.interimResults = true
    this.voiceRecognition.lang = "en-US"

    // --- Voice Enhancement Start ---
    this.voiceRecognition.onstart = () => {
      this.isListening = true
      this.showSpeechTranscript()
      this.updateFloatingMicButton()
    }

    this.voiceRecognition.onresult = (event) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      this.updateSpeechTranscript(finalTranscript + interimTranscript)

      if (finalTranscript && this.chatInput) {
        this.chatInput.value = finalTranscript
        this.chatInput.dispatchEvent(new Event("input"))
      }
    }

    this.voiceRecognition.onend = () => {
      this.isListening = false
      this.hideSpeechTranscript()
      this.updateFloatingMicButton()
    }

    this.voiceRecognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error)
      this.isListening = false
      this.hideSpeechTranscript()
      this.updateFloatingMicButton()
      this.showToast("Voice recognition error", "error")
    }
    // --- Voice Enhancement End ---
  }

  // --- Voice Enhancement Start ---
  /**
   * Show speech transcript bubble
   */
  showSpeechTranscript() {
    const transcriptBubble = document.getElementById("speech-transcript")
    if (transcriptBubble) {
      transcriptBubble.style.display = "block"
    }
  }

  /**
   * Update speech transcript content
   */
  updateSpeechTranscript(text) {
    const transcriptText = document.getElementById("transcript-text")
    if (transcriptText) {
      transcriptText.textContent = text || "Listening..."
    }
  }

  /**
   * Hide speech transcript bubble
   */
  hideSpeechTranscript() {
    const transcriptBubble = document.getElementById("speech-transcript")
    if (transcriptBubble) {
      transcriptBubble.style.display = "none"
    }
  }
  // --- Voice Enhancement End ---

  // --- Floating Buttons Start ---
  /**
   * Initialize floating action buttons
   */
  initializeFloatingButtons() {
    const floatingMicBtn = document.getElementById("floating-mic-btn")
    const floatingFileBtn = document.getElementById("floating-file-btn")
    const fileInput = document.getElementById("file-input")

    // Floating mic button
    floatingMicBtn?.addEventListener("click", () => {
      this.toggleVoiceRecognition()
    })

    // FIXED: Floating file button triggers hidden file input
    floatingFileBtn?.addEventListener("click", () => {
      fileInput?.click()
    })
  }

  /**
   * Toggle voice recognition
   */
  toggleVoiceRecognition() {
    if (!this.voiceRecognition) {
      this.showToast("Voice recognition not supported", "error")
      return
    }

    if (this.isListening) {
      this.voiceRecognition.stop()
    } else {
      this.voiceRecognition.start()
    }
  }

  /**
   * FIXED: Update floating mic button appearance with proper icon toggling
   */
  updateFloatingMicButton() {
    const micBtn = document.getElementById("floating-mic-btn")
    if (!micBtn) return

    const iconSpan = micBtn.querySelector("span")
    if (!iconSpan) return

    if (this.isListening) {
      micBtn.classList.add("listening")
      iconSpan.textContent = "stop"
      micBtn.title = "Stop listening"
      micBtn.setAttribute("aria-label", "Stop voice input")
    } else {
      micBtn.classList.remove("listening")
      iconSpan.textContent = "mic"
      micBtn.title = "Voice input"
      micBtn.setAttribute("aria-label", "Start voice input")
    }
  }
  // --- Floating Buttons End ---

  /**
   * Initialize file upload
   */
  initializeFileUpload() {
    const fileInput = document.getElementById("file-input")

    fileInput?.addEventListener("change", (e) => {
      const files = Array.from(e.target.files)
      this.handleFileUpload(files)
      e.target.value = "" // Reset input
    })
  }

  /**
   * Initialize enhanced autocomplete system
   */
  initializeAutocomplete() {
    const suggestions = [
      "What can you help me with?",
      "Explain this concept to me",
      "Write a summary of",
      "Help me brainstorm ideas for",
      "What are the pros and cons of",
      "Can you create a list of",
      "How do I",
      "What is the difference between",
      "Give me examples of",
      "Help me understand",
      "Debug this code",
      "Review my code",
      "Optimize this algorithm",
      "Write a professional email",
      "Create an outline for",
      "Analyze this data",
    ]

    const suggestionsContainer = document.getElementById("autocomplete-suggestions")
    if (!suggestionsContainer) return

    this.chatInput?.addEventListener("input", (e) => {
      const value = e.target.value.toLowerCase().trim()

      // Don't show suggestions for commands
      if (value.startsWith("/")) {
        suggestionsContainer.style.display = "none"
        this.selectedSuggestionIndex = -1
        return
      }

      if (value.length < 2) {
        suggestionsContainer.style.display = "none"
        this.selectedSuggestionIndex = -1
        return
      }

      const matchingSuggestions = suggestions
        .filter((suggestion) => suggestion.toLowerCase().includes(value))
        .slice(0, 5)

      if (matchingSuggestions.length > 0) {
        suggestionsContainer.innerHTML = matchingSuggestions
          .map(
            (suggestion, index) => `
            <div class="suggestion-item" tabindex="0" role="option" data-index="${index}">
              <span class="material-symbols-outlined">lightbulb</span>
              <span>${suggestion}</span>
            </div>
          `,
          )
          .join("")

        suggestionsContainer.style.display = "block"
        this.selectedSuggestionIndex = -1

        // Add click handlers
        suggestionsContainer.querySelectorAll(".suggestion-item").forEach((item) => {
          item.addEventListener("click", () => {
            this.chatInput.value = item.querySelector("span:last-child").textContent
            suggestionsContainer.style.display = "none"
            this.selectedSuggestionIndex = -1
            this.chatInput.focus()
          })
        })
      } else {
        suggestionsContainer.style.display = "none"
        this.selectedSuggestionIndex = -1
      }
    })

    // Hide suggestions when clicking outside
    document.addEventListener("click", (e) => {
      if (!suggestionsContainer.contains(e.target) && e.target !== this.chatInput) {
        suggestionsContainer.style.display = "none"
        this.selectedSuggestionIndex = -1
      }
    })
  }

  /**
   * Initialize enhanced command system
   */
  initializeCommandSystem() {
    const commandsContainer = document.getElementById("command-suggestions")
    if (!commandsContainer) return

    this.chatInput?.addEventListener("input", (e) => {
      const value = e.target.value.trim()

      if (!value.startsWith("/")) {
        commandsContainer.style.display = "none"
        this.selectedSuggestionIndex = -1
        return
      }

      const commandText = value.slice(1).toLowerCase()

      // --- Smart Autocomplete Enhancement Start ---
      // Get top 3 most used commands if no specific search
      let matchingCommands
      if (commandText === "") {
        matchingCommands = this.getTopUsedCommands(3)
      } else {
        matchingCommands = Object.entries(this.commands)
          .filter(([cmd]) => cmd.slice(1).toLowerCase().includes(commandText))
          .slice(0, 5)
      }
      // --- Smart Autocomplete Enhancement End ---

      if (matchingCommands.length > 0) {
        commandsContainer.innerHTML = matchingCommands
          .map(
            ([cmd, config], index) => `
            <div class="command-item" tabindex="0" role="option" data-command="${cmd}" data-index="${index}">
              <div class="command-name">${cmd}</div>
              <div class="command-description">${config.description}</div>
              <div class="command-usage">${config.example || config.usage}</div>
            </div>
          `,
          )
          .join("")

        commandsContainer.style.display = "block"
        this.selectedSuggestionIndex = -1

        // Add click handlers
        commandsContainer.querySelectorAll(".command-item").forEach((item) => {
          item.addEventListener("click", () => {
            const command = item.dataset.command
            this.chatInput.value = command + " "
            commandsContainer.style.display = "none"
            this.selectedSuggestionIndex = -1
            this.chatInput.focus()
          })
        })
      } else {
        commandsContainer.style.display = "none"
        this.selectedSuggestionIndex = -1
      }
    })
  }

  // --- Smart Autocomplete Enhancement Start ---
  /**
   * Get top used commands
   */
  getTopUsedCommands(limit = 3) {
    const sortedCommands = Object.entries(this.commandUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([cmd]) => [cmd, this.commands[cmd]])
      .filter(([cmd, config]) => config) // Filter out undefined commands

    // If we don't have enough usage data, fill with default commands
    if (sortedCommands.length < limit) {
      const defaultCommands = ["/help", "/export", "/clear"]
      for (const cmd of defaultCommands) {
        if (sortedCommands.length >= limit) break
        if (!sortedCommands.find(([c]) => c === cmd)) {
          sortedCommands.push([cmd, this.commands[cmd]])
        }
      }
    }

    return sortedCommands
  }

  /**
   * Track command usage
   */
  trackCommandUsage(command) {
    this.commandUsage[command] = (this.commandUsage[command] || 0) + 1
    this.saveSettings()
  }
  // --- Smart Autocomplete Enhancement End ---

  /**
   * Initialize plugin system
   */
  initializePlugins() {
    // Code execution plugin
    this.plugins.set("codeExecution", {
      name: "Code Execution",
      enabled: true,
      execute: (language, code) => this.executeCodeSafely(language, code),
    })

    // Image generation plugin (placeholder)
    this.plugins.set("imageGeneration", {
      name: "Image Generation",
      enabled: false,
      execute: (prompt) => this.generateImage(prompt),
    })
  }

  /**
   * Initialize user profile functionality
   */
  initializeUserProfile() {
    const profileBtn = document.getElementById("change-profile-btn")
    const profileInput = document.getElementById("profile-image-input")
    const profilePreview = document.getElementById("user-profile-preview")
    const nameInput = document.getElementById("user-name-input")

    // Load saved profile
    this.loadUserProfile()

    // Profile image change
    profileBtn?.addEventListener("click", () => {
      profileInput?.click()
    })

    profileInput?.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file) {
        this.handleProfileImageChange(file)
      }
    })

    // Name change
    nameInput?.addEventListener("input", (e) => {
      this.userProfile.name = e.target.value || "User"
      this.saveUserProfile()
      this.updateUserAvatars()
    })
  }

  /**
   * Handle profile image change
   */
  async handleProfileImageChange(file) {
    try {
      const imageUrl = await this.readFile(file)
      this.userProfile.image = imageUrl
      this.saveUserProfile()
      this.updateUserProfileUI()
      this.updateUserAvatars()
      this.showToast("Profile image updated", "success")
    } catch (error) {
      this.showToast("Failed to update profile image", "error")
    }
  }

  /**
   * Update user profile UI
   */
  updateUserProfileUI() {
    const profilePreview = document.getElementById("user-profile-preview")
    const nameInput = document.getElementById("user-name-input")

    if (profilePreview) {
      profilePreview.src = this.userProfile.image
    }

    if (nameInput) {
      nameInput.value = this.userProfile.name
    }
  }

  /**
   * Update all user avatars in chat
   */
  updateUserAvatars() {
    const userAvatars = document.querySelectorAll("#user-avatar, .user-message .message-avatar img")
    userAvatars.forEach((avatar) => {
      avatar.src = this.userProfile.image
      avatar.alt = this.userProfile.name
    })
  }

  /**
   * Save user profile to localStorage
   */
  saveUserProfile() {
    localStorage.setItem("nexus_user_profile", JSON.stringify(this.userProfile))
  }

  /**
   * Load user profile from localStorage
   */
  loadUserProfile() {
    try {
      const saved = localStorage.getItem("nexus_user_profile")
      if (saved) {
        this.userProfile = { ...this.userProfile, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error("Failed to load user profile:", error)
    }
  }

  // --- Modal Improvements Start ---
  /**
   * Initialize modal dragging functionality
   */
  initializeModalDragging() {
    document.querySelectorAll(".draggable-modal").forEach((modal) => {
      const header = modal.querySelector(".draggable-header")
      if (!header) return

      let isDragging = false
      let currentX = 0
      let currentY = 0
      let initialX = 0
      let initialY = 0

      header.addEventListener("mousedown", (e) => {
        if (e.target.closest(".modal-close")) return

        isDragging = true
        initialX = e.clientX - currentX
        initialY = e.clientY - currentY

        modal.style.position = "fixed"
        modal.style.zIndex = "1001"
        header.style.cursor = "grabbing"
      })

      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return

        e.preventDefault()
        currentX = e.clientX - initialX
        currentY = e.clientY - initialY

        modal.style.transform = `translate(${currentX}px, ${currentY}px)`
      })

      document.addEventListener("mouseup", () => {
        if (!isDragging) return

        isDragging = false
        header.style.cursor = "move"
      })
    })
  }
  // --- Modal Improvements End ---

  // --- Message Hover Preview Start ---
  /**
   * Initialize message hover preview for saved chats
   */
  initializeMessagePreview() {
    const tooltip = document.getElementById("message-preview-tooltip")
    if (!tooltip) return

    let hoverTimeout

    document.addEventListener("mouseover", (e) => {
      const chatItem = e.target.closest(".saved-chat-item:not(.new-chat-btn)")
      if (!chatItem) return

      const chatId = this.getChatIdFromElement(chatItem)
      if (!chatId || !this.chatHistory[chatId]) return

      clearTimeout(hoverTimeout)
      hoverTimeout = setTimeout(() => {
        this.showMessagePreview(chatItem, chatId, tooltip)
      }, 500)
    })

    document.addEventListener("mouseout", (e) => {
      const chatItem = e.target.closest(".saved-chat-item")
      if (!chatItem) return

      clearTimeout(hoverTimeout)
      tooltip.style.display = "none"
    })
  }

  /**
   * Show message preview tooltip
   */
  showMessagePreview(chatItem, chatId, tooltip) {
    const chat = this.chatHistory[chatId]
    if (!chat || !chat.messages.length) return

    const lastMessage = chat.messages[chat.messages.length - 1]
    const previewText = lastMessage.text.substring(0, 100) + (lastMessage.text.length > 100 ? "..." : "")
    const timestamp = new Date(lastMessage.timestamp).toLocaleString()

    tooltip.querySelector(".preview-text").textContent = previewText
    tooltip.querySelector(".preview-timestamp").textContent = timestamp

    const rect = chatItem.getBoundingClientRect()
    tooltip.style.left = rect.right + 10 + "px"
    tooltip.style.top = rect.top + "px"
    tooltip.style.display = "block"

    // Adjust position if tooltip goes off screen
    const tooltipRect = tooltip.getBoundingClientRect()
    if (tooltipRect.right > window.innerWidth) {
      tooltip.style.left = rect.left - tooltipRect.width - 10 + "px"
    }
    if (tooltipRect.bottom > window.innerHeight) {
      tooltip.style.top = rect.bottom - tooltipRect.height + "px"
    }
  }

  /**
   * Get chat ID from DOM element
   */
  getChatIdFromElement(element) {
    // This would need to be implemented based on how you store chat IDs in the DOM
    // For now, we'll use a data attribute approach
    return element.dataset.chatId
  }
  // --- Message Hover Preview End ---

  // --- Theme Enhancement Start ---
  /**
   * Initialize enhanced theme system
   */
  initializeThemeSystem() {
    // Load theme preference
    const savedTheme = localStorage.getItem("nexus_theme") || "auto"
    this.setTheme(savedTheme)

    // Update theme selector in settings
    const themeSelect = document.getElementById("theme-select")
    if (themeSelect) {
      themeSelect.value = savedTheme
      themeSelect.addEventListener("change", (e) => {
        this.setTheme(e.target.value)
      })
    }
  }

  /**
   * Set theme with enhanced options
   */
  setTheme(theme) {
    const body = document.body
    const lightButton = this.lightButton

    // Remove all theme classes
    body.classList.remove("light-mode", "matrix-mode", "cyberpunk-mode")

    switch (theme) {
      case "light":
        body.classList.add("light-mode")
        if (lightButton) lightButton.querySelector("span").textContent = "dark_mode"
        break
      case "dark":
        // Default dark theme, no additional class needed
        if (lightButton) lightButton.querySelector("span").textContent = "light_mode"
        break
      case "matrix":
        body.classList.add("matrix-mode")
        if (lightButton) lightButton.querySelector("span").textContent = "computer"
        break
      case "cyberpunk":
        body.classList.add("cyberpunk-mode")
        if (lightButton) lightButton.querySelector("span").textContent = "electric_bolt"
        break
      case "auto":
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        body.classList.toggle("light-mode", !prefersDark)
        if (lightButton) lightButton.querySelector("span").textContent = prefersDark ? "light_mode" : "dark_mode"
        break
    }

    localStorage.setItem("nexus_theme", theme)
  }
  // --- Theme Enhancement End ---

  /**
   * Handle sending a message with enhanced analytics
   */
  async handleSendMessage() {
    const message = this.chatInput?.value.trim()
    if (!message || this.isProcessing) return

    // --- Analytics Enhancement Start ---
    const messageStartTime = Date.now()
    // --- Analytics Enhancement End ---

    // Check if it's a command
    if (message.startsWith("/")) {
      this.executeCommand(message)
      this.chatInput.value = ""
      return
    }

    // Display user message
    this.displayUserMessage(message)
    this.chatInput.value = ""
    this.chatInput.style.height = "auto"

    // Hide suggestions
    this.hideSuggestions()

    // --- Analytics Enhancement Start ---
    // Update analytics
    this.analytics.messagesSent++
    this.analytics.totalCharacters += message.length
    this.analytics.totalWords += message.split(/\s+/).length
    this.messageCount++
    // --- Analytics Enhancement End ---

    // Get AI response
    await this.getAIResponse(message, messageStartTime)
  }

  /**
   * Execute a command with usage tracking
   */
  executeCommand(commandText) {
    const parts = commandText.split(" ")
    const command = parts[0]
    const args = parts.slice(1)

    if (this.commands[command]) {
      try {
        // --- Smart Autocomplete Enhancement Start ---
        this.trackCommandUsage(command)
        // --- Smart Autocomplete Enhancement End ---

        this.commands[command].execute(args)
      } catch (error) {
        console.error("Command execution error:", error)
        this.showToast(`Error executing command: ${error.message}`, "error")
      }
    } else {
      this.showToast(`Unknown command: ${command}. Type /help for available commands.`, "error")
    }
  }

  /**
   * Get AI response with enhanced analytics
   */
  async getAIResponse(message, startTime) {
    if (this.isProcessing) return

    this.isProcessing = true
    this.showLoadingIndicator()

    try {
      const modelConfig = this.apiConfigs[this.currentModel]

      if (modelConfig.streaming && this.config.streamingEnabled) {
        await this.getStreamingResponse(message)
      } else {
        await this.getRegularResponse(message)
      }

      // --- Analytics Enhancement Start ---
      // Calculate response time
      const responseTime = Date.now() - startTime
      this.analytics.responseTimes.push(responseTime)
      this.analytics.averageResponseTime =
        this.analytics.responseTimes.reduce((a, b) => a + b, 0) / this.analytics.responseTimes.length
      // --- Analytics Enhancement End ---

      this.messageCount++
    } catch (error) {
      console.error("AI response error:", error)
      this.displayBotMessage("I apologize, but I'm experiencing technical difficulties. Please try again in a moment.")
      this.showToast("Failed to get AI response", "error")
    } finally {
      this.isProcessing = false
      this.hideLoadingIndicator()
    }
  }

  /**
   * Get streaming response from AI
   */
  async getStreamingResponse(message) {
    const messageDiv = this.createBotMessageElement()
    const messageContainer = messageDiv.querySelector(".message-text")

    // Show streaming indicator
    const streamingIndicator = document.createElement("div")
    streamingIndicator.className = "streaming-indicator"
    streamingIndicator.innerHTML = `
      <div class="streaming-dots">
        <div class="streaming-dot"></div>
        <div class="streaming-dot"></div>
        <div class="streaming-dot"></div>
      </div>
      <span>NEXUS is thinking...</span>
    `
    messageContainer.appendChild(streamingIndicator)

    try {
      const response = await this.callAIAPI(message, true)

      if (response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ""

        // Remove streaming indicator
        streamingIndicator.remove()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                const content = this.extractContentFromResponse(parsed, this.currentModel)
                if (content) {
                  fullResponse += content
                  messageContainer.innerHTML = this.formatMessage(fullResponse)
                  this.scrollToBottom()
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        // Save the complete message
        this.saveMessage("bot", fullResponse)
        this.addMessageActions(messageDiv, fullResponse)
      } else {
        throw new Error("No response body")
      }
    } catch (error) {
      streamingIndicator.remove()
      messageContainer.innerHTML = "I apologize, but I encountered an error while processing your request."
      throw error
    }
  }

  /**
   * Get regular (non-streaming) response from AI
   */
  async getRegularResponse(message) {
    try {
      const response = await this.callAIAPI(message, false)
      const data = await response.json()

      const botResponse = this.extractContentFromResponse(data, this.currentModel)

      if (botResponse) {
        this.displayBotMessage(botResponse)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Regular response error:", error)
      throw error
    }
  }

  /**
   * Call AI API with unified interface
   */
  async callAIAPI(message, streaming = false) {
    const modelConfig = this.apiConfigs[this.currentModel]
    const personality = this.personalities[this.currentPersonality]

    // Build conversation history
    const messages = this.buildConversationHistory(message)

    let requestBody
    const headers = {
      "Content-Type": "application/json",
    }

    switch (this.currentModel) {
      case "gemini":
        headers["x-goog-api-key"] = modelConfig.key
        requestBody = {
          contents: messages.map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          })),
          systemInstruction: {
            parts: [{ text: personality.systemPrompt }],
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            topP: 0.8,
            topK: 40,
          },
        }
        break

      case "gpt4":
        headers["Authorization"] = `Bearer ${modelConfig.key}`
        requestBody = {
          model: "gpt-4",
          messages: [{ role: "system", content: personality.systemPrompt }, ...messages],
          temperature: 0.7,
          max_tokens: 2048,
          stream: streaming,
        }
        break

      case "claude":
        headers["Authorization"] = `Bearer ${modelConfig.key}`
        headers["anthropic-version"] = "2023-06-01"
        requestBody = {
          model: "claude-3-sonnet-20240229",
          system: personality.systemPrompt,
          messages: messages,
          max_tokens: 2048,
          temperature: 0.7,
          stream: streaming,
        }
        break
    }

    const response = await fetch(modelConfig.url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
      } catch (e) {}
      this.showToast(`API request failed: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`, 'error')
      throw new Error(`API request failed: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`)
    }
    return response
  }

  /**
   * Extract content from API response based on model
   */
  extractContentFromResponse(data, model) {
    switch (model) {
      case "gemini":
        return data.candidates?.[0]?.content?.parts?.[0]?.text || ""

      case "gpt4":
        return data.choices?.[0]?.message?.content || data.choices?.[0]?.delta?.content || ""

      case "claude":
        return data.content?.[0]?.text || data.delta?.text || ""

      default:
        return ""
    }
  }

  /**
   * Build conversation history for API call
   */
  buildConversationHistory(currentMessage) {
    const messages = []

    // Add recent messages from current chat
    if (this.currentChatId && this.chatHistory[this.currentChatId]) {
      const recentMessages = this.chatHistory[this.currentChatId].messages.slice(-10)

      for (const msg of recentMessages) {
        messages.push({
          role: msg.role === "bot" ? "assistant" : "user",
          content: msg.text,
        })
      }
    }

    // Add current message
    messages.push({
      role: "user",
      content: currentMessage,
    })

    return messages
  }

  /**
   * Display user message in chat with enhanced features
   */
  displayUserMessage(text, saveToHistory = true) {
    const messageDiv = document.createElement("div")
    messageDiv.className = "chat-message outgoing"
    messageDiv.dataset.messageId = Date.now().toString()

    // --- Chat Enhancement Start ---
    // Add reply reference if replying to a message
    let replyHtml = ""
    if (this.replyToMessage) {
      replyHtml = `
        <div class="reply-reference">
          <div class="reply-author">${this.replyToMessage.role === "user" ? "You" : "NEXUS"}</div>
          <div>${this.replyToMessage.text.substring(0, 100)}${this.replyToMessage.text.length > 100 ? "..." : ""}</div>
        </div>
      `
      messageDiv.classList.add("reply")
      this.replyToMessage = null
    }
    // --- Chat Enhancement End ---

    const currentTime = new Date()
    const formattedTime = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    messageDiv.innerHTML = `
      <div class="message-bubble user-message">
        <div class="message-content">
          ${replyHtml}
          <div class="message-text">${this.escapeHtml(text)}</div>
          <div class="message-meta">
            <span class="message-time">${formattedTime}</span>
            <div class="message-actions">
              <button class="action-btn edit-btn" title="Edit message" aria-label="Edit message">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="action-btn copy-btn" title="Copy message" aria-label="Copy message">
                <span class="material-symbols-outlined">content_copy</span>
              </button>
              <button class="action-btn reply-btn" title="Reply to message" aria-label="Reply to message">
                <span class="material-symbols-outlined">reply</span>
              </button>
            </div>
          </div>
        </div>
        <div class="message-avatar">
          <img id="user-avatar" src="${this.userProfile.image}" alt="${this.userProfile.name}" />
        </div>
      </div>
    `

    this.chatContainer?.appendChild(messageDiv)
    this.scrollToBottom()

    // Add event listeners
    this.addMessageActions(messageDiv, text)

    if (saveToHistory) {
      this.saveMessage("user", text)
      this.displaySavedChats()
    }
  }

  /**
   * Display bot message in chat with enhanced features
   */
  displayBotMessage(text, saveToHistory = true) {
    const messageDiv = this.createBotMessageElement()
    const messageContainer = messageDiv.querySelector(".message-text")

    // Format and display the message
    const formattedText = this.formatMessage(text)
    messageContainer.innerHTML = formattedText

    // Add message actions
    this.addMessageActions(messageDiv, text)

    if (saveToHistory) {
      this.saveMessage("bot", text)
      this.displaySavedChats()
    }
  }

  /**
   * Create bot message element with enhanced actions
   */
  createBotMessageElement() {
    const messageDiv = document.createElement("div")
    messageDiv.className = "chat-message incoming"
    messageDiv.dataset.messageId = Date.now().toString()

    const currentTime = new Date()
    const formattedTime = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    messageDiv.innerHTML = `
      <div class="message-bubble bot-message">
        <div class="message-avatar">
          <img src="/images/NEXUS.png" alt="NEXUS" />
        </div>
        <div class="message-content">
          <div class="message-text"></div>
          <div class="message-meta">
            <span class="message-time">${formattedTime}</span>
            <div class="message-actions">
              <button class="action-btn copy-btn" title="Copy message" aria-label="Copy message">
                <span class="material-symbols-outlined">content_copy</span>
              </button>
              <button class="action-btn tts-btn" title="Read aloud" aria-label="Read message aloud">
                <span class="material-symbols-outlined">volume_up</span>
              </button>
              <button class="action-btn pin-btn" title="Pin message" aria-label="Pin message">
                <span class="material-symbols-outlined">push_pin</span>
              </button>
              <button class="action-btn reply-btn" title="Reply to message" aria-label="Reply to message">
                <span class="material-symbols-outlined">reply</span>
              </button>
              <button class="action-btn regenerate-btn" title="Regenerate response" aria-label="Regenerate response">
                <span class="material-symbols-outlined">refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `

    this.chatContainer?.appendChild(messageDiv)
    this.scrollToBottom()

    return messageDiv
  }

  /**
   * Add enhanced message action handlers
   */
  addMessageActions(messageDiv, messageText) {
    const messageId = messageDiv.dataset.messageId

    // Copy button
    const copyBtn = messageDiv.querySelector(".copy-btn")
    copyBtn?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(messageText)
        copyBtn.querySelector("span").textContent = "check"
        copyBtn.classList.add("success")
        setTimeout(() => {
          copyBtn.querySelector("span").textContent = "content_copy"
          copyBtn.classList.remove("success")
        }, 2000)
      } catch (error) {
        this.showToast("Failed to copy message", "error")
      }
    })

    // TTS button
    const ttsBtn = messageDiv.querySelector(".tts-btn")
    ttsBtn?.addEventListener("click", () => {
      this.speakMessage(messageText, ttsBtn)
    })

    // Edit button (for user messages)
    const editBtn = messageDiv.querySelector(".edit-btn")
    editBtn?.addEventListener("click", () => {
      if (this.chatInput) {
        this.chatInput.value = messageText
        this.chatInput.focus()
      }
    })

    // --- Chat Enhancement Start ---
    // Pin button
    const pinBtn = messageDiv.querySelector(".pin-btn")
    pinBtn?.addEventListener("click", () => {
      this.togglePinMessage(messageDiv, messageId)
    })

    // Reply button
    const replyBtn = messageDiv.querySelector(".reply-btn")
    replyBtn?.addEventListener("click", () => {
      this.setReplyToMessage(messageDiv, messageText)
    })
    // --- Chat Enhancement End ---

    // Regenerate button (for bot messages)
    const regenerateBtn = messageDiv.querySelector(".regenerate-btn")
    regenerateBtn?.addEventListener("click", () => {
      this.regenerateResponse(messageDiv)
    })
  }

  /**
   * Enhanced code execution modal
   */
  showCodeModal() {
    this.showModal("code-modal")

    // Clear previous event listeners
    const runBtn = document.getElementById("run-code")
    const clearBtn = document.getElementById("clear-code")
    const codeInput = document.getElementById("code-input")
    const codeResult = document.getElementById("code-result")

    // Clone buttons to remove old event listeners
    if (runBtn) {
      const newRunBtn = runBtn.cloneNode(true)
      runBtn.parentNode.replaceChild(newRunBtn, runBtn)

      newRunBtn.addEventListener("click", async () => {
        const code = codeInput?.value
        const activeTab = document.querySelector(".code-tab.active")
        const language = activeTab?.dataset.lang || "javascript"

        if (!code?.trim()) {
          this.showToast("Please enter some code to execute", "error")
          return
        }

        newRunBtn.disabled = true
        newRunBtn.textContent = "Running..."

        try {
          const result = await this.executeCodeSafely(language, code)
          if (codeResult) {
            codeResult.textContent = result
          }
        } catch (error) {
          if (codeResult) {
            codeResult.textContent = `Error: ${error.message}`
          }
        } finally {
          newRunBtn.disabled = false
          newRunBtn.textContent = "Run Code"
        }
      })
    }

    if (clearBtn) {
      const newClearBtn = clearBtn.cloneNode(true)
      clearBtn.parentNode.replaceChild(newClearBtn, clearBtn)

      newClearBtn.addEventListener("click", () => {
        if (codeInput) codeInput.value = ""
        if (codeResult) codeResult.textContent = ""
      })
    }

    // Code tab switching
    document.querySelectorAll(".code-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".code-tab").forEach((t) => t.classList.remove("active"))
        tab.classList.add("active")
      })
    })
  }

  // --- Chat Enhancement Start ---
  /**
   * Toggle pin status of a message
   */
  togglePinMessage(messageDiv, messageId) {
    const pinBtn = messageDiv.querySelector(".pin-btn")

    if (this.pinnedMessages.has(messageId)) {
      this.pinnedMessages.delete(messageId)
      messageDiv.classList.remove("pinned")
      pinBtn.classList.remove("pinned")
      pinBtn.title = "Pin message"
    } else {
      this.pinnedMessages.add(messageId)
      messageDiv.classList.add("pinned")
      pinBtn.classList.add("pinned")
      pinBtn.title = "Unpin message"
    }

    this.savePinnedMessages()
  }

  /**
   * Set message to reply to
   */
  setReplyToMessage(messageDiv, messageText) {
    const isUserMessage = messageDiv.classList.contains("outgoing")
    this.replyToMessage = {
      role: isUserMessage ? "user" : "bot",
      text: messageText,
    }

    this.showToast("Reply mode activated", "info")
    this.chatInput?.focus()
  }

  /**
   * Pin the last message
   */
  pinLastMessage() {
    const messages = this.chatContainer?.querySelectorAll(".chat-message")
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      const messageId = lastMessage.dataset.messageId
      if (messageId) {
        this.togglePinMessage(lastMessage, messageId)
      }
    }
  }

  /**
   * Save pinned messages to storage
   */
  savePinnedMessages() {
    localStorage.setItem(this.storageKeys.PINNED_MESSAGES, JSON.stringify([...this.pinnedMessages]))
  }

  /**
   * Load pinned messages from storage
   */
  loadPinnedMessages() {
    try {
      const saved = localStorage.getItem(this.storageKeys.PINNED_MESSAGES)
      if (saved) {
        this.pinnedMessages = new Set(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Failed to load pinned messages:", error)
    }
  }
  // --- Chat Enhancement End ---

  /**
   * Speak message using TTS
   */
  speakMessage(text, button) {
    if (!("speechSynthesis" in window)) {
      this.showToast("Text-to-speech not supported", "error")
      return
    }

    // Stop any current speech
    window.speechSynthesis.cancel()

    if (button.classList.contains("active")) {
      button.classList.remove("active")
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 0.8
    utterance.volume = 0.9

    // Find a suitable voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice =
      voices.find((voice) => voice.lang.includes("en") && !voice.name.toLowerCase().includes("female")) || voices[0]

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => {
      button.classList.add("active")
      button.querySelector("span").textContent = "stop"
    }

    utterance.onend = () => {
      button.classList.remove("active")
      button.querySelector("span").textContent = "volume_up"
    }

    utterance.onerror = () => {
      button.classList.remove("active")
      button.querySelector("span").textContent = "volume_up"
      this.showToast("Speech synthesis failed", "error")
    }

    window.speechSynthesis.speak(utterance)
  }

  /**
   * Regenerate AI response
   */
  async regenerateResponse(messageDiv) {
    // Find the previous user message
    const messages = Array.from(this.chatContainer.children)
    const currentIndex = messages.indexOf(messageDiv)

    let userMessage = null
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (messages[i].classList.contains("outgoing")) {
        const messageText = messages[i].querySelector(".message-text").textContent
        userMessage = messageText
        break
      }
    }

    if (!userMessage) {
      this.showToast("No previous message found to regenerate", "error")
      return
    }

    // Remove the current bot message
    messageDiv.remove()

    // Get new response
    await this.getAIResponse(userMessage, Date.now())
  }

  // --- Chat Enhancement Start ---
  /**
   * Summarize the current chat
   */
  async summarizeChat() {
    if (
      !this.currentChatId ||
      !this.chatHistory[this.currentChatId] ||
      this.chatHistory[this.currentChatId].messages.length === 0
    ) {
      this.showToast("No chat to summarize", "error")
      return
    }

    const messages = this.chatHistory[this.currentChatId].messages
    const conversationText = messages
      .map((msg) => `${msg.role === "user" ? "User" : "NEXUS"}: ${msg.text}`)
      .join("\n\n")

    const summaryPrompt = `Please provide a concise summary of this conversation:\n\n${conversationText}\n\nSummary:`

    try {
      this.displayUserMessage("Summarize this chat", false)
      await this.getAIResponse(summaryPrompt, Date.now())
    } catch (error) {
      this.showToast("Failed to generate summary", "error")
    }
  }
  // --- Chat Enhancement End ---

  /**
   * Format message text with markdown-like formatting
   */
  formatMessage(text) {
    let formatted = this.escapeHtml(text)

    // Handle code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const codeBlocks = []
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const language = match[1] || "plaintext"
      const code = match[2].trim()

      codeBlocks.push({
        placeholder: `__CODE_BLOCK_${codeBlocks.length}__`,
        language,
        code,
        fullMatch: match[0],
      })

      formatted = formatted.replace(this.escapeHtml(match[0]), `__CODE_BLOCK_${codeBlocks.length - 1}__`)
    }

    // Basic markdown formatting
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    formatted = formatted.replace(/\*([^*]+)\*/g, "<em>$1</em>")
    formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>")

    // List handling: group consecutive <li> into a single <ul>
    formatted = formatted.replace(/^(\* .*)/gm, '<li>$1</li>')
    formatted = formatted.replace(/^(\d+)\. (.*)/gm, '<li>$2</li>')
    formatted = formatted.replace(/(<li>.*?<\/li>\s*)+/gs, (match) => `<ul>${match.replace(/\n/g, '')}</ul>`) // group <li> blocks

    // Paragraphs
    formatted = formatted
      .split(/\n{2,}/)
      .map((p) => (p.trim() ? `<p>${p.trim()}</p>` : ""))
      .join("")

    // Replace code blocks
    codeBlocks.forEach((block, index) => {
      const codeHTML = `
        <div class="code-block" data-language="${block.language}">
          <div class="code-header">
            <span class="code-language">${block.language}</span>
            <div class="code-actions">
              <button class="copy-code-btn" title="Copy code" aria-label="Copy code">
                <span class="material-symbols-outlined">content_copy</span>
              </button>
              <button class="execute-code-btn" title="Execute code" aria-label="Execute code" data-language="${block.language}">
                <span class="material-symbols-outlined">play_arrow</span>
              </button>
            </div>
          </div>
          <pre class="code-content"><code class="language-${block.language}">${this.escapeHtml(block.code)}</code></pre>
        </div>
      `

      formatted = formatted.replace(`__CODE_BLOCK_${index}__`, codeHTML)
    })

    return formatted
  }

  /**
   * Escape HTML characters
   */
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }

  /**
   * Handle file upload
   * Read file content
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = () => reject(new Error("Failed to read file"))

      if (file.type.startsWith("image/")) {
        reader.readAsDataURL(file)
      } else {
        reader.readAsText(file)
      }
    })
  }

  /**
   * Create file preview
   */
  async createFilePreview(file, content) {
    if (file.type.startsWith("image/")) {
      return `<img src="${content}" alt="${file.name}" style="max-width: 100%; height: auto;" />`
    } else if (file.type === "application/pdf") {
      return `<p>PDF file: ${file.name} (${this.formatFileSize(file.size)})</p>`
    } else {
      return `<pre><code>${this.escapeHtml(content.substring(0, 1000))}${content.length > 1000 ? "..." : ""}</code></pre>`
    }
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  /**
   * Execute code safely
   */
  async executeCodeSafely(language, code) {
    try {
      let result

      switch (language.toLowerCase()) {
        case "javascript":
        case "js":
          result = this.executeJavaScript(code)
          break

        case "python":
        case "py":
          result = await this.executePython(code)
          break

        default:
          throw new Error(`Unsupported language: ${language}`)
      }

      return result
    } catch (error) {
      return `Error: ${error.message}`
    }
  }

  /**
   * Execute JavaScript code
   */
  executeJavaScript(code) {
    try {
      // Create a safe execution context
      const safeGlobals = {
        console: {
          log: (...args) => args.join(" "),
          error: (...args) => "Error: " + args.join(" "),
          warn: (...args) => "Warning: " + args.join(" "),
        },
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
      }

      // Create function with limited scope
      const func = new Function(
        ...Object.keys(safeGlobals),
        `
        "use strict";
        let output = [];
        const originalLog = console.log;
        console.log = (...args) => output.push(args.join(" "));
        
        try {
          ${code}
        } catch (error) {
          output.push("Error: " + error.message);
        }
        
        return output.join("\\n");
      `,
      )

      return func(...Object.values(safeGlobals))
    } catch (error) {
      return `Execution Error: ${error.message}`
    }
  }

  /**
   * Execute Python code (simulated - would need a real Python interpreter)
   */
  async executePython(code) {
    // This is a placeholder - in a real implementation, you'd use a service like Pyodide
    return "Python execution not implemented in this demo. Would require Pyodide or server-side execution."
  }

  /**
   * Chat management methods
   */
  createNewChat() {
    this.currentChatId = "chat_" + Date.now()
    this.chatHistory[this.currentChatId] = {
      title: "New Chat",
      timestamp: Date.now(),
      messages: [],
      model: this.currentModel,
      personality: this.currentPersonality,
    }

    this.chatContainer.innerHTML = ""
    this.saveSettings()
    this.displaySavedChats()

    // Show greeting
    setTimeout(() => {
      const greeting = this.personalities[this.currentPersonality].greeting
      this.displayBotMessage(greeting, false)
    }, 300)
  }

  loadChat(chatId) {
    if (!this.chatHistory[chatId]) return false

    this.currentChatId = chatId
    this.chatContainer.innerHTML = ""

    // Load messages
    this.chatHistory[chatId].messages.forEach((msg) => {
      if (msg.role === "user") {
        this.displayUserMessage(msg.text, false)
      } else {
        this.displayBotMessage(msg.text, false)
      }
    })

    this.displaySavedChats()
    return true
  }

  saveMessage(role, text) {
    if (!this.memoryEnabled) return

    if (!this.currentChatId) {
      this.createNewChat()
    }

    const message = {
      role,
      text,
      timestamp: Date.now(),
      model: this.currentModel,
      personality: this.currentPersonality,
    }

    this.chatHistory[this.currentChatId].messages.push(message)

    // Update chat title based on first user message
    if (
      role === "user" &&
      this.chatHistory[this.currentChatId].messages.filter((m) => m.role === "user").length === 1
    ) {
      let title = text.substring(0, 30)
      if (text.length > 30) title += "..."
      this.chatHistory[this.currentChatId].title = title
    }

    this.saveSettings()
  }

  clearChat() {
    if (confirm("Are you sure you want to clear the current chat?")) {
      this.chatContainer.innerHTML = ""

      if (this.currentChatId) {
        delete this.chatHistory[this.currentChatId]
        this.createNewChat()
      }

      this.displaySavedChats()
    }
  }

  deleteChat(chatId) {
    if (confirm("Are you sure you want to delete this chat?")) {
      delete this.chatHistory[chatId]

      if (chatId === this.currentChatId) {
        this.createNewChat()
      }

      this.saveSettings()
      this.displaySavedChats()
    }
  }

  displaySavedChats() {
    const container = document.querySelector(".saved-chats-container")
    if (!container) return

    container.innerHTML = ""

    // New chat button
    const newChatBtn = document.createElement("div")
    newChatBtn.className = "saved-chat-item new-chat-btn"
    newChatBtn.innerHTML = `
      <div class="chat-item-icon">
        <span class="material-symbols-outlined">add</span>
      </div>
      <div class="chat-item-content">
        <span class="chat-title">New Chat</span>
      </div>
    `
    newChatBtn.addEventListener("click", () => this.createNewChat())
    container.appendChild(newChatBtn)

    // Existing chats
    const sortedChats = Object.entries(this.chatHistory).sort((a, b) => b[1].timestamp - a[1].timestamp)

    sortedChats.forEach(([id, chat]) => {
      const chatItem = document.createElement("div")
      chatItem.className = "saved-chat-item"
      chatItem.dataset.chatId = id // For message preview functionality
      if (id === this.currentChatId) chatItem.classList.add("active")

      const date = new Date(chat.timestamp)
      const formattedDate = date.toLocaleDateString(undefined, { month: "short", day: "numeric" })

      chatItem.innerHTML = `
        <div class="chat-item-icon">
          <span class="material-symbols-outlined">chat</span>
        </div>
        <div class="chat-item-content">
          <span class="chat-title">${chat.title}</span>
          <span class="chat-date">${formattedDate}</span>
        </div>
        <div class="chat-item-actions">
          <button class="action-btn export-chat-btn" data-id="${id}" title="Export chat" aria-label="Export chat">
            <span class="material-symbols-outlined">download</span>
          </button>
          <button class="action-btn delete-chat-btn" data-id="${id}" title="Delete chat" aria-label="Delete chat">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      `

      // Event listeners
      chatItem.addEventListener("click", (e) => {
        if (!e.target.closest(".chat-item-actions")) {
          this.loadChat(id)
        }
      })

      chatItem.querySelector(".export-chat-btn").addEventListener("click", (e) => {
        e.stopPropagation()
        this.exportChat("markdown", id)
      })

      chatItem.querySelector(".delete-chat-btn").addEventListener("click", (e) => {
        e.stopPropagation()
        this.deleteChat(id)
      })

      container.appendChild(chatItem)
    })
  }

  filterChats(searchTerm) {
    const items = document.querySelectorAll(".saved-chat-item")
    const term = searchTerm.toLowerCase()

    items.forEach((item) => {
      const title = item.querySelector(".chat-title")?.textContent.toLowerCase() || ""
      const isNewChatBtn = item.classList.contains("new-chat-btn")

      if (isNewChatBtn || title.includes(term)) {
        item.style.display = "flex"
      } else {
        item.style.display = "none"
      }
    })
  }

  /**
   * UI Management Methods
   */
  showModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.classList.add("active")
      modal.setAttribute("aria-hidden", "false")

      // Focus first focusable element
      const focusable = modal.querySelector("button, input, select, textarea")
      if (focusable) {
        setTimeout(() => focusable.focus(), 100)
      }
    }
  }

  closeModal(modal) {
    if (modal) {
      modal.classList.remove("active")
      modal.setAttribute("aria-hidden", "true")
    }
  }

  showModelModal() {
    this.showModal("model-modal")

    // Add click handlers for model cards
    document.querySelectorAll(".model-card").forEach((card) => {
      card.addEventListener("click", () => {
        const model = card.dataset.model
        this.switchModel(model)
        this.closeModal(document.getElementById("model-modal"))
      })
    })
  }

  showPersonalityModal() {
    this.showModal("personality-modal")

    // Add click handlers for personality cards
    document.querySelectorAll(".personality-card").forEach((card) => {
      card.addEventListener("click", () => {
        const personality = card.dataset.personality
        this.switchPersonality(personality)
        this.closeModal(document.getElementById("personality-modal"))
      })
    })
  }

  showSettingsModal() {
    this.showModal("settings-modal")
    this.loadSettingsUI()
  }

  // --- Analytics Enhancement Start ---
  /**
   * Show analytics modal with detailed session information
   */
  showAnalyticsModal() {
    this.showModal("analytics-modal")
    this.updateAnalyticsDisplay()
  }

  /**
   * Update analytics display
   */
  updateAnalyticsDisplay() {
    const sessionTime = Date.now() - this.analytics.sessionStart
    const hours = Math.floor(sessionTime / 3600000)
    const minutes = Math.floor((sessionTime % 3600000) / 60000)
    const seconds = Math.floor((sessionTime % 60000) / 1000)

    document.getElementById("analytics-session-time").textContent =
      `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

    document.getElementById("analytics-message-count").textContent = this.analytics.messagesSent.toString()

    const avgWords =
      this.analytics.messagesSent > 0 ? Math.round(this.analytics.totalWords / this.analytics.messagesSent) : 0
    document.getElementById("analytics-avg-words").textContent = avgWords.toString()

    const avgResponse = this.analytics.responseTimes.length > 0 ? Math.round(this.analytics.averageResponseTime) : 0
    document.getElementById("analytics-avg-response").textContent = `${avgResponse}ms`

    document.getElementById("analytics-total-chars").textContent = this.analytics.totalCharacters.toString()

    document.getElementById("analytics-current-model").textContent = this.currentModel.toUpperCase()
  }
  // --- Analytics Enhancement End ---

  showTemplateModal(category) {
    const modal = document.getElementById("template-modal")
    const templateList = document.getElementById("template-list")

    if (!modal || !templateList) return

    const templates = this.templates[category] || []

    templateList.innerHTML = templates
      .map(
        (template) => `
      <div class="template-item" data-prompt="${this.escapeHtml(template.prompt)}">
        <h3>${template.title}</h3>
        <p>${template.description}</p>
        <button class="use-template-btn">Use Template</button>
      </div>
    `,
      )
      .join("")

    // Add click handlers
    templateList.querySelectorAll(".use-template-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const templateItem = e.target.closest(".template-item")
        const prompt = templateItem.dataset.prompt

        if (this.chatInput) {
          this.chatInput.value = prompt
          this.chatInput.focus()
        }

        this.closeModal(modal)
      })
    })

    this.showModal("template-modal")
  }

  /**
   * Enhanced code execution modal
   */
  showCodeModal() {
    this.showModal("code-modal")

    // Clear previous event listeners
    const runBtn = document.getElementById("run-code")
    const clearBtn = document.getElementById("clear-code")
    const codeInput = document.getElementById("code-input")
    const codeResult = document.getElementById("code-result")

    // Clone buttons to remove old event listeners
    if (runBtn) {
      const newRunBtn = runBtn.cloneNode(true)
      runBtn.parentNode.replaceChild(newRunBtn, runBtn)

      newRunBtn.addEventListener("click", async () => {
        const code = codeInput?.value
        const activeTab = document.querySelector(".code-tab.active")
        const language = activeTab?.dataset.lang || "javascript"

        if (!code?.trim()) {
          this.showToast("Please enter some code to execute", "error")
          return
        }

        newRunBtn.disabled = true
        newRunBtn.textContent = "Running..."

        try {
          const result = await this.executeCodeSafely(language, code)
          if (codeResult) {
            codeResult.textContent = result
          }
        } catch (error) {
          if (codeResult) {
            codeResult.textContent = `Error: ${error.message}`
          }
        } finally {
          newRunBtn.disabled = false
          newRunBtn.textContent = "Run Code"
        }
      })
    }

    if (clearBtn) {
      const newClearBtn = clearBtn.cloneNode(true)
      clearBtn.parentNode.replaceChild(newClearBtn, clearBtn)

      newClearBtn.addEventListener("click", () => {
        if (codeInput) codeInput.value = ""
        if (codeResult) codeResult.textContent = ""
      })
    }

    // Code tab switching
    document.querySelectorAll(".code-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".code-tab").forEach((t) => t.classList.remove("active"))
        tab.classList.add("active")
      })
    })
  }

  showFilePreview(filename, content) {
    const modal = document.getElementById("file-preview-modal")
    const titleElement = document.getElementById("file-preview-title")
    const contentElement = document.getElementById("file-preview-content")

    if (titleElement) titleElement.textContent = `File Preview: ${filename}`
    if (contentElement) contentElement.innerHTML = content

    this.showModal("file-preview-modal")
  }

  showExportModal() {
    this.showModal("settings-modal")
    this.switchSettingsTab("export")
  }

  switchSettingsTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".settings-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName)
      tab.setAttribute("aria-selected", tab.dataset.tab === tabName)
    })

    // Update panels
    document.querySelectorAll(".settings-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `${tabName}-panel`)
    })
  }

  loadSettingsUI() {
    // Load current settings into UI
    const themeSelect = document.getElementById("theme-select")
    const fontSizeSlider = document.getElementById("font-size-slider")
    const autosaveInterval = document.getElementById("autosave-interval")
    const defaultModelSelect = document.getElementById("default-model-select")

    if (themeSelect) {
      themeSelect.value = localStorage.getItem("nexus_theme") || "auto"
    }

    if (fontSizeSlider) {
      fontSizeSlider.value = Number.parseInt(document.documentElement.style.fontSize) || 14
    }

    if (autosaveInterval) {
      autosaveInterval.value = this.config.autoSaveInterval / 60000
    }

    if (defaultModelSelect) {
      defaultModelSelect.value = this.currentModel
    }

    // Add event listeners
    fontSizeSlider?.addEventListener("input", (e) => {
      document.documentElement.style.fontSize = e.target.value + "px"
    })

    autosaveInterval?.addEventListener("change", (e) => {
      this.config.autoSaveInterval = Number.parseInt(e.target.value) * 60000
      this.saveSettings()
    })

    defaultModelSelect?.addEventListener("change", (e) => {
      this.switchModel(e.target.value)
    })
  }

  /**
   * Theme and UI methods
   */
  setupTheme() {
    const savedTheme = localStorage.getItem("nexus_theme") || "auto"
    this.setTheme(savedTheme)
  }

  toggleTheme() {
    const currentTheme = localStorage.getItem("nexus_theme") || "auto"
    const themes = ["auto", "light", "dark", "matrix", "cyberpunk"]
    const currentIndex = themes.indexOf(currentTheme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    this.setTheme(nextTheme)
  }

  // FIXED: Sidebar toggle method with proper state management
  toggleSidebar() {
    const sidebar = document.querySelector(".sidebar")
    const toggleBtn = document.getElementById("toggle-sidebar")
    const overlay = document.querySelector(".sidebar-overlay")

    if (!sidebar || !toggleBtn) return

    const isCollapsed = sidebar.classList.contains("collapsed")

    // Toggle sidebar state
    sidebar.classList.toggle("collapsed")

    // Update button state and aria-expanded
    const newExpandedState = !sidebar.classList.contains("collapsed")
    toggleBtn.setAttribute("aria-expanded", newExpandedState.toString())
    toggleBtn.classList.toggle("collapsed", !newExpandedState)

    // Handle mobile overlay
    if (overlay && window.innerWidth <= 768) {
      overlay.classList.toggle("active", newExpandedState)
    }

    // Show toast for user feedback
    this.showToast(newExpandedState ? "Sidebar opened" : "Sidebar closed", "info")
  }

  updateUI() {
    // Update model display
    const currentModelSpan = document.getElementById("current-model")
    if (currentModelSpan) {
      const modelNames = { gemini: "Gemini", gpt4: "GPT-4", claude: "Claude" }
      currentModelSpan.textContent = modelNames[this.currentModel] || this.currentModel
    }

    // Update personality display
    const currentPersonalitySpan = document.getElementById("current-personality")
    if (currentPersonalitySpan) {
      currentPersonalitySpan.textContent = this.personalities[this.currentPersonality].name
    }

    // Update memory toggle
    const memoryToggle = document.getElementById("memory-toggle")
    if (memoryToggle) {
      memoryToggle.checked = this.memoryEnabled
    }
  }

  /**
   * Model and personality switching
   */
  switchModel(model) {
    if (this.apiConfigs[model]) {
      this.currentModel = model
      this.updateUI()
      this.saveSettings()
      this.showToast(`Switched to ${model.toUpperCase()}`, "success")
    }
  }

  switchPersonality(personality) {
    if (this.personalities[personality]) {
      this.currentPersonality = personality
      this.updateUI()
      this.saveSettings()

      const config = this.personalities[personality]
      this.displayBotMessage(config.greeting, false)
      this.showToast(`Switched to ${config.name} mode`, "success")
    }
  }

  /**
   * Export and import methods with JSON chat import support
   */
  exportData(format) {
    try {
      let data, filename, mimeType

      switch (format) {
        case "json":
          data = JSON.stringify(
            {
              chatHistory: this.chatHistory,
              settings: {
                personality: this.currentPersonality,
                model: this.currentModel,
                memoryEnabled: this.memoryEnabled,
              },
              analytics: this.analytics,
              exportDate: new Date().toISOString(),
            },
            null,
            2,
          )
          filename = `nexus-export-${Date.now()}.json`
          mimeType = "application/json"
          break

        case "markdown":
          data = this.generateMarkdownExport()
          filename = `nexus-export-${Date.now()}.md`
          mimeType = "text/markdown"
          break

        case "pdf":
          this.generatePDFExport()
          return

        default:
          throw new Error("Unsupported export format")
      }

      this.downloadFile(data, filename, mimeType)
      this.showToast(`Exported as ${format.toUpperCase()}`, "success")
    } catch (error) {
      console.error("Export error:", error)
      this.showToast("Export failed", "error")
    }
  }

  generateMarkdownExport() {
    let markdown = `# NEXUS AI Assistant Export\n\n`
    markdown += `**Export Date:** ${new Date().toLocaleString()}\n`
    markdown += `**Total Conversations:** ${Object.keys(this.chatHistory).length}\n\n`

    Object.entries(this.chatHistory).forEach(([id, chat]) => {
      markdown += `## ${chat.title}\n\n`
      markdown += `**Date:** ${new Date(chat.timestamp).toLocaleString()}\n`
      markdown += `**Model:** ${chat.model || "Unknown"}\n`
      markdown += `**Personality:** ${chat.personality || "Unknown"}\n\n`

      chat.messages.forEach((msg) => {
        const role = msg.role === "user" ? "**You**" : "**NEXUS**"
        const time = new Date(msg.timestamp).toLocaleTimeString()
        markdown += `### ${role} (${time})\n\n${msg.text}\n\n`
      })

      markdown += "---\n\n"
    })

    return markdown
  }

  generatePDFExport() {
    // This would require a PDF library like jsPDF
    this.showToast("PDF export not implemented in this demo", "error")
  }

  exportChat(format, chatId = null) {
    const id = chatId || this.currentChatId
    if (!id || !this.chatHistory[id]) {
      this.showToast("No chat to export", "error")
      return
    }

    const chat = this.chatHistory[id]
    let data, filename, mimeType

    switch (format) {
      case "markdown":
        data = `# ${chat.title}\n\n`
        data += `**Date:** ${new Date(chat.timestamp).toLocaleString()}\n\n`

        chat.messages.forEach((msg) => {
          const role = msg.role === "user" ? "**You**" : "**NEXUS**"
          const time = new Date(msg.timestamp).toLocaleTimeString()
          data += `## ${role} (${time})\n\n${msg.text}\n\n`
        })

        filename = `${chat.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.md`
        mimeType = "text/markdown"
        break

      default:
        this.showToast("Unsupported export format", "error")
        return
    }

    this.downloadFile(data, filename, mimeType)
    this.showToast("Chat exported successfully", "success")
  }

  downloadFile(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  importData() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"

    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        const text = await this.readFile(file)
        const data = JSON.parse(text)

        if (data.chatHistory) {
          // Merge imported chats
          Object.assign(this.chatHistory, data.chatHistory)
          this.displaySavedChats()
        }

        if (data.settings) {
          if (data.settings.personality) this.switchPersonality(data.settings.personality)
          if (data.settings.model) this.switchModel(data.settings.model)
          if (typeof data.settings.memoryEnabled === "boolean") {
            this.memoryEnabled = data.settings.memoryEnabled
          }
        }

        this.saveSettings()
        this.showToast("Data imported successfully", "success")
      } catch (error) {
        console.error("Import error:", error)
        this.showToast("Failed to import data", "error")
      }
    }

    input.click()
  }

  /**
   * Utility methods
   */
  showLoadingIndicator() {
    const indicator = document.getElementById("loading-indicator")
    if (indicator) {
      indicator.style.display = "flex"
    }
  }

  hideLoadingIndicator() {
    const indicator = document.getElementById("loading-indicator")
    if (indicator) {
      indicator.style.display = "none"
    }
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container")
    if (!container) return

    const toast = document.createElement("div")
    toast.className = `toast toast-${type}`

    const icons = {
      success: "check_circle",
      error: "error",
      warning: "warning",
      info: "info",
    }

    toast.innerHTML = `
      <span class="material-symbols-outlined">${icons[type] || "info"}</span>
      <span>${message}</span>
      <button class="toast-close" aria-label="Close notification">
        <span class="material-symbols-outlined">close</span>
      </button>
    `

    // Add close handler
    toast.querySelector(".toast-close").addEventListener("click", () => {
      toast.remove()
    })

    container.appendChild(toast)

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove()
      }
    }, 5000)

    // Animate in
    setTimeout(() => toast.classList.add("show"), 100)
  }

  // Dynamically set chat-container bottom padding to match typing-container height
  updateChatPadding() {
    const chatContainer = document.querySelector('.chat-container');
    const typingContainer = document.querySelector('.typing-container');
    if (chatContainer && typingContainer) {
      const height = typingContainer.offsetHeight;
      chatContainer.style.paddingBottom = height + 16 + 'px'; // 16px extra for spacing
    }
  }

  // Debounce utility
  debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Sidebar swipe gesture for mobile
  initializeSidebarGestures() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    let startX = null;
    let currentX = null;
    let threshold = 60; // px
    // Open sidebar with swipe right
    document.addEventListener('touchstart', (e) => {
      if (window.innerWidth > 900) return;
      if (e.touches[0].clientX < 30) startX = e.touches[0].clientX;
    });
    document.addEventListener('touchmove', (e) => {
      if (startX !== null) currentX = e.touches[0].clientX;
    });
    document.addEventListener('touchend', () => {
      if (startX !== null && currentX !== null && currentX - startX > threshold) {
        sidebar?.classList.remove('collapsed');
        overlay?.classList.add('active');
        document.body.classList.add('no-scroll');
      }
      startX = currentX = null;
    });
    // Close sidebar with swipe left on sidebar
    sidebar?.addEventListener('touchstart', (e) => {
      if (window.innerWidth > 900) return;
      startX = e.touches[0].clientX;
    });
    sidebar?.addEventListener('touchmove', (e) => {
      if (startX !== null) currentX = e.touches[0].clientX;
    });
    sidebar?.addEventListener('touchend', () => {
      if (startX !== null && currentX !== null && startX - currentX > threshold) {
        sidebar.classList.add('collapsed');
        overlay?.classList.remove('active');
        document.body.classList.remove('no-scroll');
      }
      startX = currentX = null;
    });
  }

  // Patch sidebar/modal open/close to toggle .no-scroll on body
  toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.getElementById("toggle-sidebar");
    const overlay = document.querySelector(".sidebar-overlay");
    if (!sidebar || !toggleBtn) return;
    const isCollapsed = sidebar.classList.contains("collapsed");
    sidebar.classList.toggle("collapsed");
    const newExpandedState = !sidebar.classList.contains("collapsed");
    if (overlay) overlay.classList.toggle("active", newExpandedState);
    document.body.classList.toggle('no-scroll', newExpandedState);
    this.showToast(newExpandedState ? "Sidebar opened" : "Sidebar closed", "info");
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add('no-scroll');
      const focusable = modal.querySelector("button, input, select, textarea");
      if (focusable) focusable.focus();
    }
  }
  closeModal(modal) {
    if (modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
      // If no modals left open, remove no-scroll
      if (!document.querySelector('.modal-overlay.active')) {
        document.body.classList.remove('no-scroll');
      }
    }
  }

  scrollToBottom() {
    if (this.chatContainer) {
      this.chatContainer.scrollTop = this.chatContainer.scrollHeight
    }
  }

  /**
   * Command implementations
   */
  showHelp(args = []) {
    if (args.length > 0) {
      const command = "/" + args[0]
      if (this.commands[command]) {
        const config = this.commands[command]
        const helpText = `
**${command}**
${config.description}

**Usage:** ${config.usage}
**Example:** ${config.example}
        `
        this.displayBotMessage(helpText, false)
      } else {
        this.displayBotMessage(`Command "${command}" not found.`, false)
      }
    } else {
      const helpText = `
**Available Commands:**

${Object.entries(this.commands)
  .map(([cmd, config]) => `• **${cmd}** - ${config.description}`)
  .join("\n")}

Type \`/help [command]\` for detailed information about a specific command.
      `
      this.displayBotMessage(helpText, false)
    }
  }

  /**
   * Storage methods
   */
  saveSettings() {
    try {
      const settings = {
        chatHistory: this.chatHistory,
        currentPersonality: this.currentPersonality,
        currentModel: this.currentModel,
        memoryEnabled: this.memoryEnabled,
        config: this.config,
        analytics: this.analytics,
        commandUsage: this.commandUsage,
        pinnedMessages: [...this.pinnedMessages],
        userProfile: this.userProfile,
      }

      localStorage.setItem(this.storageKeys.SETTINGS, JSON.stringify(settings))
    } catch (error) {
      console.error("Failed to save settings:", error)
    }
  }

  async loadSettings() {
    try {
      const saved = localStorage.getItem(this.storageKeys.SETTINGS)
      if (saved) {
        const settings = JSON.parse(saved)

        this.chatHistory = settings.chatHistory || {}
        this.currentPersonality = settings.currentPersonality || "professional"
        this.currentModel = settings.currentModel || "gemini"
        this.memoryEnabled = settings.memoryEnabled !== false
        this.config = { ...this.config, ...settings.config }
        this.analytics = { ...this.analytics, ...settings.analytics }
        this.commandUsage = settings.commandUsage || {}
        this.pinnedMessages = new Set(settings.pinnedMessages || [])
        this.userProfile = { ...this.userProfile, ...settings.userProfile }
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }

  loadChatHistory() {
    // Chat history is now loaded as part of settings
    this.displaySavedChats()
  }

  autoSave() {
    if (this.memoryEnabled) {
      this.saveSettings()
    }
  }

  /**
   * Cleanup method
   */
  destroy() {
    // Clear timers
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer)
    }

    // Stop speech recognition
    if (this.voiceRecognition) {
      this.voiceRecognition.stop()
    }

    // Stop speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    // Save final state
    this.saveSettings()
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.nexusAI = new NexusAI()

  // Handle page unload
  window.addEventListener("beforeunload", () => {
    if (window.nexusAI) {
      window.nexusAI.destroy()
    }
  })
})

// Handle visibility change for analytics
document.addEventListener("visibilitychange", () => {
  if (window.nexusAI && document.hidden) {
    window.nexusAI.saveSettings()
  }
})
