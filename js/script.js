const apiKey = 'DEMO_KEY';
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const fetchButton = document.getElementById('fetchImagesButton');
const gallery = document.getElementById('gallery');
const statusMessage = document.getElementById('statusMessage');
const spaceFact = document.getElementById('spaceFact');
const modalOverlay = document.getElementById('modalOverlay');
const closeModalButton = document.getElementById('closeModalButton');
const modalMedia = document.getElementById('modalMedia');
const modalDate = document.getElementById('modalDate');
const modalTitle = document.getElementById('modalTitle');
const modalExplanation = document.getElementById('modalExplanation');

const spaceFacts = [
	'The Sun contains more than 99.8% of the solar system’s total mass.',
	'A day on Venus is longer than a year on Venus.',
	'One teaspoon of a neutron star would weigh billions of tons on Earth.',
	'There are more stars in the universe than grains of sand on all of Earth’s beaches.',
	'Mars has the largest volcano in the solar system: Olympus Mons.',
	'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.'
];

let currentItems = [];

// Set up the default date range from the starter helper.
setupDateInputs(startInput, endInput);

// Show one random fact each time the app loads.
setRandomSpaceFact();

fetchButton.addEventListener('click', fetchSpaceImages);
closeModalButton.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (event) => {
	if (event.target === modalOverlay) {
		closeModal();
	}
});

window.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
		closeModal();
	}
});

function setRandomSpaceFact() {
	const randomIndex = Math.floor(Math.random() * spaceFacts.length);
	spaceFact.textContent = spaceFacts[randomIndex];
}

function showStatus(message) {
	statusMessage.textContent = message;
}

function clearGallery() {
	gallery.innerHTML = '';
}

async function fetchSpaceImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate) {
		showStatus('Please choose both a start date and an end date.');
		return;
	}

	if (new Date(startDate) > new Date(endDate)) {
		showStatus('The start date must be on or before the end date.');
		return;
	}

	const apiUrl = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;

	showStatus('🔄 Loading space photos...');
	clearGallery();

	try {
		const response = await fetch(apiUrl);

		if (!response.ok) {
			throw new Error(`NASA API request failed with status ${response.status}.`);
		}

		const data = await response.json();
		currentItems = Array.isArray(data) ? data : [data];

		renderGallery(currentItems);

		if (currentItems.length === 0) {
			showStatus('No space photos were returned for that date range.');
			return;
		}

		showStatus(`Showing ${currentItems.length} NASA APOD item${currentItems.length === 1 ? '' : 's'}.`);
	} catch (error) {
		console.error(error);
		showStatus('Sorry, the NASA images could not be loaded right now. Please try again.');
	}
}

function renderGallery(items) {
	clearGallery();

	if (!items || items.length === 0) {
		gallery.innerHTML = '<div class="empty-state">No images found for the selected date range.</div>';
		return;
	}

	items.forEach((item, index) => {
		const card = createGalleryItem(item, index);
		gallery.appendChild(card);
	});
}

function createGalleryItem(item, index) {
	const card = document.createElement('article');
	card.className = 'gallery-item';
	card.tabIndex = 0;
	card.setAttribute('role', 'button');
	card.setAttribute('aria-label', `Open details for ${item.title}`);

	const mediaWrap = document.createElement('div');
	mediaWrap.className = 'gallery-item-media';

	const previewUrl = item.media_type === 'image'
		? item.url
		: item.thumbnail_url || '';

	if (previewUrl) {
		const image = document.createElement('img');
		image.src = previewUrl;
		image.alt = item.title;
		mediaWrap.appendChild(image);
	} else {
		const fallback = document.createElement('div');
		fallback.className = 'empty-state';
		fallback.textContent = item.media_type === 'video' ? 'Video preview unavailable' : 'Preview unavailable';
		mediaWrap.appendChild(fallback);
	}

	const badge = document.createElement('span');
	badge.className = 'media-badge';
	badge.textContent = item.media_type === 'video' ? 'Video' : 'Photo';
	mediaWrap.appendChild(badge);

	const content = document.createElement('div');
	content.className = 'gallery-item-content';

	const title = document.createElement('h2');
	title.textContent = item.title;

	const date = document.createElement('p');
	date.textContent = item.date;

	content.appendChild(title);
	content.appendChild(date);

	if (item.media_type === 'video') {
		const videoLink = document.createElement('a');
		videoLink.className = 'video-link';
		videoLink.href = item.url;
		videoLink.target = '_blank';
		videoLink.rel = 'noreferrer';
		videoLink.textContent = 'Watch video on NASA';
		videoLink.addEventListener('click', (event) => {
			event.stopPropagation();
		});
		content.appendChild(videoLink);
	}

	card.appendChild(mediaWrap);
	card.appendChild(content);

	card.addEventListener('click', () => openModal(item));
	card.addEventListener('keydown', (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openModal(item);
		}
	});

	card.dataset.index = String(index);
	return card;
}

function openModal(item) {
	modalDate.textContent = item.date;
	modalTitle.textContent = item.title;
	modalExplanation.textContent = item.explanation;
	modalMedia.innerHTML = '';

	if (item.media_type === 'video') {
		const iframe = document.createElement('iframe');
		iframe.src = getEmbeddableVideoUrl(item.url);
		iframe.title = item.title;
		iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
		iframe.allowFullscreen = true;
		modalMedia.appendChild(iframe);
	} else {
		const image = document.createElement('img');
		image.src = item.hdurl || item.url;
		image.alt = item.title;
		modalMedia.appendChild(image);
	}

	modalOverlay.classList.remove('hidden');
	modalOverlay.setAttribute('aria-hidden', 'false');
	closeModalButton.focus();
}

function closeModal() {
	modalOverlay.classList.add('hidden');
	modalOverlay.setAttribute('aria-hidden', 'true');
	modalMedia.innerHTML = '';
}

function getEmbeddableVideoUrl(url) {
	if (url.includes('youtube.com/watch')) {
		const videoId = new URL(url).searchParams.get('v');
		return `https://www.youtube.com/embed/${videoId}`;
	}

	if (url.includes('youtu.be/')) {
		const videoId = url.split('youtu.be/')[1].split('?')[0];
		return `https://www.youtube.com/embed/${videoId}`;
	}

	return url;
}
