// Contract ABI - Replace with your contract's ABI
const contractAddress = "YOUR_CONTRACT_ADDRESS_HERE";
const contractABI = [
    "function createPost(uint256 postId) public",
    "function vote(uint256 postId, bool isUpvote) public",
    "function getPost(uint256 postId) public view returns (tuple(uint256 postId, address userId, uint256 upvotes, uint256 downvotes, bool isFinalized))",
    "function getUser(address userId) public view returns (tuple(uint256 credibilityScore, uint256 successfulPosts))",
    "event PostCreated(uint256 postId, address userId)",
    "event Voted(uint256 postId, address userId, bool isUpvote, uint256 weight)",
    "event PostFinalized(uint256 postId)"
];

let provider;
let signer;
let contract;
let userAddress;

// Connect to MetaMask
async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            alert('Please install MetaMask!');
            return;
        }

        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAddress = accounts[0];

        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);

        document.getElementById('connectWallet').textContent = 'Connected';
        document.getElementById('userAddress').textContent = userAddress;
        document.getElementById('userInfo').classList.remove('hidden');

        // Load user info
        await updateUserInfo();
        // Load posts
        await loadPosts();

        // Listen for events
        setupEventListeners();

    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet!');
    }
}

// Create a new post
async function createPost() {
    try {
        const postId = document.getElementById('postId').value;
        if (!postId) {
            alert('Please enter a Post ID!');
            return;
        }

        const tx = await contract.createPost(postId);
        await tx.wait();

        alert('Post created successfully!');
        document.getElementById('postId').value = '';
        await loadPosts();
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post!');
    }
}

// Vote on a post
async function vote(postId, isUpvote) {
    try {
        const tx = await contract.vote(postId, isUpvote);
        await tx.wait();
        await loadPosts();
    } catch (error) {
        console.error('Error voting:', error);
        alert('Failed to vote!');
    }
}

// Load user information
async function updateUserInfo() {
    try {
        const user = await contract.getUser(userAddress);
        document.getElementById('credibilityScore').textContent = user.credibilityScore.toString();
        document.getElementById('successfulPosts').textContent = user.successfulPosts.toString();
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Load posts
async function loadPosts() {
    try {
        const postsList = document.getElementById('postsList');
        postsList.innerHTML = '';

        // For demonstration, we'll load posts 1-5
        // In a real app, you'd want to keep track of created posts
        for (let i = 1; i <= 5; i++) {
            try {
                const post = await contract.getPost(i);
                if (post.userId !== ethers.constants.AddressZero) {
                    const postElement = createPostElement(post);
                    postsList.appendChild(postElement);
                }
            } catch (error) {
                console.log(`No post found for ID ${i}`);
            }
        }
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Create HTML element for a post
function createPostElement(post) {
    const div = document.createElement('div');
    div.className = `post-card ${post.isFinalized ? 'finalized' : ''}`;
    
    div.innerHTML = `
        <div class="info">
            <span>Post ID: ${post.postId}</span>
            <span>Creator: ${post.userId.slice(0, 6)}...${post.userId.slice(-4)}</span>
        </div>
        <div>
            <p>Upvotes: ${post.upvotes}</p>
            <p>Downvotes: ${post.downvotes}</p>
            ${post.isFinalized ? '<p>✅ Finalized</p>' : ''}
        </div>
        ${!post.isFinalized ? `
        <div class="votes">
            <button onclick="vote(${post.postId}, true)">Upvote</button>
            <button onclick="vote(${post.postId}, false)">Downvote</button>
        </div>
        ` : ''}
    `;
    
    return div;
}

// Setup event listeners for contract events
function setupEventListeners() {
    contract.on('PostCreated', (postId, userId) => {
        console.log('New post created:', postId.toString());
        loadPosts();
    });

    contract.on('Voted', (postId, userId, isUpvote, weight) => {
        console.log('New vote:', postId.toString(), isUpvote);
        loadPosts();
        updateUserInfo();
    });

    contract.on('PostFinalized', (postId) => {
        console.log('Post finalized:', postId.toString());
        loadPosts();
        updateUserInfo();
    });
}

// Connect wallet button event listener
document.getElementById('connectWallet').addEventListener('click', connectWallet);

// Handle account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', function (accounts) {
        window.location.reload();
    });

    window.ethereum.on('chainChanged', function (chainId) {
        window.location.reload();
    });
} 