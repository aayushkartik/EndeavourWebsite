$(document).ready(function() {
	$nav = $('.nav');
	$toggleCollapse = $('.toggle-collapse');
	const navLinks = document.querySelectorAll('.nav-link');

	navLinks.forEach(link => {
		link.addEventListener('click', () => {
			$nav.toggleClass('collapse');
		});
	});

	/**click event on toggle menu*/
	$toggleCollapse.click(function() {
		$nav.toggleClass('collapse');
	});
});
