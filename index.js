(function (factory, global) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		define('chosen', [], factory);
	} else {
		factory.call(global, global.module);
	}

})(function (module) {

	'use strict';

	// #region helpers declarations

	var extendObject;

	// #endregion

	var Chosen = function ($element, options) {

		if (!(this instanceof Chosen)) return new Chosen($element, options);

		this.$element = $element;

		this.options.isMultiple = $element.getAttribute('multiple') === 'multiple';

		extendObject(this.options, options);

		this.items = this.getItems(this.$element);

		this.currentItems = this.items.slice();

		this.htmlComponents = [];

		this.resultsElements = [];

		this.query = '';

		this.$selectedResult = null;

		this.buildHtml(this.items, this.$element, this.options);

		this.registerEvents();

		if (this.$element.value) {
			this.setSelectedValue(this.$element.value);
		} else {
			this.setSelectedValue(null);
		}
	};

	// #region properties

	Chosen.prototype.options = {};

	Chosen.prototype.selectors = {};

	// #endregion properties

	// #region initialization

	Chosen.prototype.buildHtml = function (items, $element, options) {

		var elementBoundingRectangle = $element.getBoundingClientRect();

		if (typeof options.width === 'undefined') {
			options.width = elementBoundingRectangle.width;
		}

		if (typeof options.height === 'undefined') {
			options.height = elementBoundingRectangle.height;
		}

		var $dropdownContainer = this.buildChosenContainer(options),
			$dropdownMask = options.isMultiple
				? this.buildMultipleDropdownMask(options)
				: this.buildSingleDropdownMask(options),
			$dropdown = this.buildDropdown(options, items);

		this.$dropdownContainer = $dropdownContainer;
		this.$dropdownMask = $dropdownMask;
		this.$dropdown = $dropdown;

		$dropdownContainer.appendChild($dropdownMask);
		$dropdownContainer.appendChild($dropdown);

		$element.style.display = 'none';

		$element.parentNode.insertBefore($dropdownContainer, $element.nextSibling);
	};

	Chosen.prototype.buildChosenContainer = function (options) {

		var $chosenContainer = document.createElement('div');

		$chosenContainer.classList.add('chosen-container');
		$chosenContainer.classList.add('chosen-container-single');

		$chosenContainer.style.width = options.width;

		this.htmlComponents.push($chosenContainer);

		return $chosenContainer;
	};

	Chosen.prototype.buildSingleDropdownMask = function (options) {

		var $dropdownMaskContainer = document.createElement('a'),
			$selectedValueContainer = document.createElement('span'),
			$caretContainer = document.createElement('div'),
			$caret = document.createElement('b');

		$dropdownMaskContainer.classList.add('chosen-single');
		$dropdownMaskContainer.setAttribute('tabindex', -1);

		$caretContainer.appendChild($caret);
		$dropdownMaskContainer.appendChild($selectedValueContainer);
		$dropdownMaskContainer.appendChild($caretContainer);

		this.htmlComponents.push($dropdownMaskContainer);
		this.htmlComponents.push($selectedValueContainer);
		this.htmlComponents.push($caretContainer);
		this.htmlComponents.push($caret);

		this.$selectedValueContainer = $selectedValueContainer;

		return $dropdownMaskContainer;
	};

	Chosen.prototype.buildMultipleDropdownMask = function (options) {

	};

	Chosen.prototype.buildDropdown = function (options, items) {

		var $dropdownContainer = document.createElement('div'),
			$searchInputContainer = document.createElement('div'),
			$searchInput = document.createElement('input'),
			$resultsContainer = document.createElement('ul'),
			$results = this.buildResults(items);

		$dropdownContainer.classList.add('chosen-drop');
		$searchInputContainer.classList.add('chosen-search');
		$resultsContainer.classList.add('chosen-results');

		$searchInput.setAttribute('type', 'text');
		$searchInput.setAttribute('autocomplete', 'off');
		$searchInput.setAttribute('tabindex', '2');

		this.appendResults($results, $resultsContainer);

		$searchInputContainer.appendChild($searchInput);

		$dropdownContainer.appendChild($searchInputContainer);
		$dropdownContainer.appendChild($resultsContainer);

		this.htmlComponents.push($dropdownContainer);
		this.htmlComponents.push($searchInputContainer);
		this.htmlComponents.push($searchInput);
		this.htmlComponents.push($resultsContainer);
		this.htmlComponents.push($results);

		this.$resultsContainer = $resultsContainer;
		this.$searchInputContainer = $searchInputContainer;
		this.$searchInput = $searchInput;

		return $dropdownContainer;
	};

	Chosen.prototype.buildResults = function (items) {

		if (!items || items.length === 0) {

			var $noResults = document.createElement('li');

			$noResults.classList.add('chosen-result');
			$noResults.classList.add('no-results');

			if (this.query) {

				var $queryElement = document.createElement('span');

				$queryElement.textContent = this.query;

				$noResults.textContent = this.options.noResultsText || 'No results match ';

				$noResults.appendChild($queryElement);

			} else {

				$noResults.textContent = this.options.emptyListText || 'No items in list';
			}

			return [$noResults];
		}

		var htmlComponents = this.htmlComponents,
			resultsElements = this.resultsElements,
			options = this.options,
			query = this.query,
			selectedValue = this.selectedValue;

		return items.map(function (item, index) {

			var $result = document.createElement('li');

			$result.classList.add('chosen-result');
			$result.classList.add(item.disabled
				? 'inactive-result'
				: 'active-result');

			$result.setAttribute('data-option-array-index', index + 1);
			$result.setAttribute('data-option-value', item.value || '');

			if (typeof options.renderResult === 'function') {
				$result.textContent = options.renderResult(item, query, selectedValue);
			} else {
				$result.textContent = item.text;
			}

			resultsElements.push($result);

			return $result;
		});
	};

	Chosen.prototype.registerEvents = function () {

		document.addEventListener('click', this.evOnOuterClick.bind(this));

		this.$dropdownMask.addEventListener('click', this.evOnContainerClick.bind(this));
		this.$dropdownMask.addEventListener('focus', this.evOnContainerFocus.bind(this));

		this.registerSearchEvents();

		this.registerResultsEvents(this.resultsElements);
	};

	Chosen.prototype.registerResultsEvents = function (resultsElements) {

		for (var i = 0; i < resultsElements.length; i++) {
			resultsElements[i].addEventListener('click', this.evResultClick.bind(this));
			resultsElements[i].addEventListener('mouseenter', this.evResultMouseEnter.bind(this));
			resultsElements[i].addEventListener('mouseleave', this.evResultMouseLeave.bind(this));
		}
	};

	Chosen.prototype.registerSearchEvents = function () {

		this.$searchInputContainer.addEventListener('click', this.evSearchContainerClick.bind(this));

		this.$searchInput.addEventListener('keyup', this.evSearchKeyUp.bind(this));
	};

	// #endregion initialization

	// #region event handlers

	Chosen.prototype.evOnContainerFocus = function (e) {

		e.stopPropagation();

		this.focused = true;

		this.$dropdownContainer.classList.add('chosen-container-active');

		this.$searchInput.focus();
	};

	Chosen.prototype.evOnOuterClick = function (e) {

		this.focused = false;

		this.closeDropdown();

		this.$dropdownContainer.classList.remove('chosen-container-active');
	};

	Chosen.prototype.evOnContainerClick = function (e) {

		e.preventDefault();
		e.stopPropagation();

		this.opened = !this.opened;

		this.performQuery(this.query);

		if (this.opened) {
			this.openDropdown();
		} else {
			this.closeDropdown();
		}
	};

	Chosen.prototype.evResultClick = function (e) {

		e.preventDefault();

		if (this.$selectedResult) {
			this.$selectedResult.classList.remove('result-selected');
		}

		this.$selectedResult = e.target;

		var selectedValue = this.$selectedResult.getAttribute('data-option-value');

		this.$selectedResult.classList.add('result-selected');

		this.setSelectedValue(selectedValue);
	};

	Chosen.prototype.evResultMouseEnter = function (e) {

		var $target = e.target;

		$target.classList.add('highlighted');
	};

	Chosen.prototype.evResultMouseLeave = function (e) {

		var $target = e.target;

		$target.classList.remove('highlighted');
	};

	Chosen.prototype.evSearchKeyUp = function (e) {

		var query = e.target.value;

		this.query = query;

		this.performQuery(this.query);
	};

	Chosen.prototype.evSearchContainerClick = function (e) {

		e.stopPropagation();
	};

	// #endregion event handlers

	// #region internal methods

	Chosen.prototype.openDropdown = function () {

		this.opened = true;

		this.$dropdownContainer.classList.add('chosen-with-drop');
	};

	Chosen.prototype.closeDropdown = function () {

		this.opened = false;

		this.$dropdownContainer.classList.remove('chosen-with-drop');

		this.resetDropdownResults();
	};

	Chosen.prototype.isChosenComponent = function ($element) {

		return this.htmlComponents.indexOf($element) !== -1 || this.resultsElements.indexOf($element) !== -1;
	};

	Chosen.prototype.getItems = function ($select) {
		
		var $options = $select.querySelectorAll('option[value]:not([value=""])'),
			items = [];

		var $emptyOption = $select.querySelector('option:not([value])') || $select.querySelector('option[value=""]');

		if ($emptyOption) {
			items.push({
				value: null,
				text: $emptyOption.innerText || $emptyOption.textContent
			});
		}

		for (var i = 0; i < $options.length; i++) {

			items.push({
				value: $options[i].getAttribute('value'),
				text: $options[i].innerText || $options[i].textContent
			});
		}

		return items;
	};

	Chosen.prototype.getItemByResultIndex = function (index) {

		if (typeof index !== 'number') {
			index = parseInt(index);
		}

		index = index - 1;

		return this.items[index];
	};

	Chosen.prototype.getItemByValue = function (value) {

		value = value || null;

		var matches = this.items.filter(function (item) {
			return item.value === value;
		});

		return matches[0];
	};

	Chosen.prototype.setSelectedValue = function (value) {

		this.selectedValue = value;

		var selectedItem = this.getItemByValue(value),
			selectedItemText = selectedItem.text || '';

		if (typeof this.options.renderSelectedValue === 'function') {
			this.$selectedValueContainer.textContent = this.options.renderSelectedValue(selectedItem, this.query);
		} else {
			this.$selectedValueContainer.textContent = selectedItemText;
		}

		this.$element.value = value;

		if ("createEvent" in document) {
		    var evt = document.createEvent("HTMLEvents");
		    evt.initEvent("change", false, true);
		    this.$element.dispatchEvent(evt);
		}
		else {
			this.$element.fireEvent("onchange");
		}    

		if (typeof this.options.change === 'function') {
			this.options.change(this.getItemByValue(value), this.getItemByValue(previousSelectedValue), this.$element);
		}

		return this.selectedValue;
	};

	Chosen.prototype.getSelectedValue = function () {

		return this.selectedValue;
	};

	Chosen.prototype.appendResults = function ($results, $resultsContainer) {

		var $currentResults = $resultsContainer.querySelectorAll('.chosen-result');

		for (var i = 0; i < $currentResults.length; i++) {
			$resultsContainer.removeChild($currentResults[i]);
		}

		for (var i = 0; i < $results.length; i++) {
			$resultsContainer.appendChild($results[i]);
		}
	};

	Chosen.prototype.queryItems = function (query, selectedValue) {

		var queryResults;

		if (!query) {
			queryResults = this.items.slice();
		} else {
			queryResults = this.items.filter(function (item) {
				return item.text && item.text.toUpperCase().indexOf(query.toUpperCase()) !== -1;
			});
		}

		if (selectedValue) {

			var indexOfSelectedValue = queryResults.map(function (result) {
				return result.value;
			}).indexOf(selectedValue);

			if (indexOfSelectedValue !== -1) {
				queryResults.splice(indexOfSelectedValue, 1);
			}
		}		

		return queryResults;
	};

	Chosen.prototype.performQuery = function (query) {

		this.currentItems = this.queryItems(this.query, this.selectedValue);

		this.resultsElements = this.buildResults(this.currentItems);

		this.appendResults(this.resultsElements, this.$resultsContainer);

		this.registerResultsEvents(this.resultsElements);
	};

	Chosen.prototype.resetDropdownResults = function () {

		this.query = '';

		this.$searchInput.value = '';

		this.performQuery('');
	};

	// #endregion

	// export the constructor, if module object is present
	if (typeof module !== 'undefined' && module !== null) {
		module.exports = Chosen;
	} else {
		this.Chosen = Chosen;
	}

	// #region helpers definitions

	extendObject = function (target, source) {

		if (!target) {
			return target;
		}

		if (!source) {
			return source;
		}

		for (var prop in source) {
			if (source.hasOwnProperty(prop)) {

				if (typeof source[prop] !== 'undefined') {

					if (typeof source[prop] !== 'object') {
						target[prop] = source[prop];
					} else {

						if (typeof target[prop] !== 'object') {
							target[prop] = {};
						}

						extendObject(target[prop], source[prop]);
					}
				}
			}
		}

		return target;
	};

	// #endregion helpers definitions

	return Chosen;

}, this);
