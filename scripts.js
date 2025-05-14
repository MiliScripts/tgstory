// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;

// Log initData to console
console.log('Telegram WebApp User Data:', tg.initData);
console.log('Telegram WebApp User:', tg.initDataUnsafe.user);

// Enable closing confirmation dialog
tg.enableClosingConfirmation();

// Expand WebApp to full height
tg.expand();

// DOM Elements
const mediaButton = document.getElementById('mediaButton');
const mediaModal = document.getElementById('mediaModal');
const closeModal = document.getElementById('closeModal');
const imageOption = document.getElementById('imageOption');
const videoOption = document.getElementById('videoOption');
const fileInput = document.getElementById('fileInput');
const mediaPreview = document.getElementById('mediaPreview');
const previewImage = document.getElementById('previewImage');
const previewVideo = document.getElementById('previewVideo');
const closePreview = document.getElementById('closePreview');
const confirmSelection = document.getElementById('confirmSelection');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const loadingStories = document.getElementById('loadingStories');

// Stories Elements
const storiesViewer = document.getElementById('storiesViewer');
const storyProgress = document.getElementById('storyProgress');
const storyImage = document.getElementById('storyImage');
const storyVideo = document.getElementById('storyVideo');
const prevStory = document.getElementById('prevStory');
const nextStory = document.getElementById('nextStory');
const closeStories = document.getElementById('closeStories');
const storyInfo = document.getElementById('storyInfo');

// Stories State
let stories = [];
let currentStoryIndex = 0;
let storyTimeout = null;

// Stories Functions
async function fetchStories() {
    try {
        const userId = tg.initDataUnsafe.user.id;
        const response = await fetch(`https://telegram-upload-api.farziandoc5650.workers.dev/stories/${userId}`);
        if (!response.ok) throw new Error('خطا در دریافت استوری‌ها');
        stories = await response.json();
        return stories.length > 0;
    } catch (error) {
        console.error('Error fetching stories:', error);
        return false;
    }
}

function updateStoryProgress() {
    storyProgress.innerHTML = stories.map((_, index) => `
        <div class="h-1 flex-1 bg-white ${index === currentStoryIndex ? 'bg-opacity-100' : 'bg-opacity-30'}"></div>
    `).join('');
}

function showCurrentStory() {
    const story = stories[currentStoryIndex];
    const mediaUrl = story.download_url;
    const createdAt = new Date(story.created_at);
    const timeAgo = new Intl.RelativeTimeFormat('fa').format(
        Math.ceil((createdAt - new Date()) / (1000 * 60 * 60 * 24)),
        'day'
    );

    // Reset media elements
    storyImage.classList.add('hidden');
    storyVideo.classList.add('hidden');
    storyVideo.pause();

    // Show appropriate media element
    if (mediaUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
        storyImage.src = mediaUrl;
        storyImage.classList.remove('hidden');
    } else {
        storyVideo.src = mediaUrl;
        storyVideo.classList.remove('hidden');
        storyVideo.play();
    }

    // Update progress and info
    updateStoryProgress();
    storyInfo.textContent = timeAgo;

    // Clear existing timeout
    if (storyTimeout) clearTimeout(storyTimeout);

    // Set timeout for auto-advance (only for images)
    if (mediaUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
        storyTimeout = setTimeout(() => {
            if (currentStoryIndex < stories.length - 1) {
                currentStoryIndex++;
                showCurrentStory();
            } else {
                closeStoriesViewer();
            }
        }, 5000);
    }
}

function showStoriesViewer() {
    storiesViewer.classList.remove('hidden');
    currentStoryIndex = 0;
    showCurrentStory();
}

function closeStoriesViewer() {
    storiesViewer.classList.add('hidden');
    storyVideo.pause();
    if (storyTimeout) clearTimeout(storyTimeout);
}

// Event Listeners
mediaButton.addEventListener('click', () => {
    mediaModal.classList.add('active');
});

closeModal.addEventListener('click', () => {
    mediaModal.classList.remove('active');
});

imageOption.addEventListener('click', () => {
    fileInput.accept = 'image/*';
    fileInput.click();
    mediaModal.classList.remove('active');
});

videoOption.addEventListener('click', () => {
    fileInput.accept = 'video/*';
    fileInput.click();
    mediaModal.classList.remove('active');
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        if (file.type.startsWith('image/')) {
            previewVideo.classList.add('hidden');
            previewImage.classList.remove('hidden');
            previewImage.src = e.target.result;
        } else {
            previewImage.classList.add('hidden');
            previewVideo.classList.remove('hidden');
            previewVideo.src = e.target.result;
        }
        mediaPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

closePreview.addEventListener('click', () => {
    mediaPreview.classList.add('hidden');
    fileInput.value = '';
});

confirmSelection.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    mediaPreview.classList.add('hidden');
    uploadProgress.classList.remove('hidden');

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', tg.initDataUnsafe.user.id);

        const response = await fetch('https://telegram-upload-api.farziandoc5650.workers.dev/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Upload failed');

        const result = await response.json();
        console.log('Upload successful:', result);

        // Reset UI
        fileInput.value = '';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        uploadProgress.classList.add('hidden');

        // Show success message or update UI as needed
        alert('آپلود با موفقیت انجام شد');

    } catch (error) {
        console.error('Upload error:', error);
        alert('خطا در آپلود فایل');
        uploadProgress.classList.add('hidden');
    }
});

// Stories Event Listeners
document.querySelector('button:nth-child(2)').addEventListener('click', async () => {
    loadingStories.classList.remove('hidden');
    try {
        const hasStories = await fetchStories();
        if (hasStories) {
            showStoriesViewer();
        } else {
            alert('هیچ استوری‌ای یافت نشد');
        }
    } catch (error) {
        console.error('Error loading stories:', error);
        alert('خطا در بارگذاری استوری‌ها');
    } finally {
        loadingStories.classList.add('hidden');
    }
});

prevStory.addEventListener('click', () => {
    if (currentStoryIndex > 0) {
        currentStoryIndex--;
        showCurrentStory();
    }
});

nextStory.addEventListener('click', () => {
    if (currentStoryIndex < stories.length - 1) {
        currentStoryIndex++;
        showCurrentStory();
    } else {
        closeStoriesViewer();
    }
});

closeStories.addEventListener('click', closeStoriesViewer);

// Handle keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!storiesViewer.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft') nextStory.click();
        else if (e.key === 'ArrowRight') prevStory.click();
        else if (e.key === 'Escape') closeStoriesViewer();
    }
});

// Handle touch navigation
let touchStartX = 0;
storiesViewer.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});

storiesViewer.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) { // Minimum swipe distance
        if (diff > 0) nextStory.click(); // Swipe left
        else prevStory.click(); // Swipe right
    }
});