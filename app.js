// BUDGET CONTROLLER
const budgetController = (() => {
	const data = {
		allItems: {
			income: [],
			expense: []
		},
		totals: {
			income: 0,
			expense: 0
		},
		budget: 0,
		percentage: -1
	};
	// id generators functions for income and expense
	const generateIncomeId = generateId();
	const generateExpenseId = generateId();

	
	class Income {
		constructor(id, description, value) {
			this.id = id;
			this.description = description;
			this.value = value;
		}
	}


	class Expense {
		constructor(id, description, value) {
			this.id = id;
			this.description = description;
			this.value = value;
			this.percentage = -1;
		}

		calculatePercentage(totalIncome) {
			if (totalIncome > 0) {
				this.percentage = Math.round((this.value / totalIncome) * 100);
			} else {
				this.percentage = -1;
			}
		}
	}


	// we need this id generator to have an id in closure for each type separately
	function generateId() {
		let id = 0;
		return () => id++;
	}


	function addItem(type, desc, val) {
		let newItem;

		// 1. create an id for a new item
		// 2. creating new item object

		if (type === 'income') {
			newItem = new Income(generateIncomeId(), desc, val);
		} else if (type === 'expense') {
			newItem = new Expense(generateExpenseId(), desc, val);
		}

		// 3. pushing a new item's object to an items array
		data.allItems[type].push(newItem);

		// 4. return new item
		return newItem;
	}


	function deleteItem(type, id) {
		// remove item from budget data
		data.allItems[type].forEach((itemObj, i, arr) => {
			if (itemObj.id === id) {
				return arr.splice(i, 1);
			}
		});
	}


	function calculateTotal(type) {
		let sum = data.allItems[type].reduce((accum, itemObj) => accum + itemObj.value, 0);
		// we need here initValue, so each object could meet the callback
		data.totals[type] = sum;
	}


	function calculateBudget() {

		// 1. calculate total income and total expense
		calculateTotal('income');
		calculateTotal('expense');

		// 2. calculate available budget: income - expense
		// we need toFixed to prevent wrong JS calculation with big amount of numbers after a dot
		data.budget = parseFloat((data.totals.income - data.totals.expense).toFixed(2));

		// 3. calculate the percentage
		if (data.totals.income > 0) {
			data.percentage = Math.round((data.totals.expense / data.totals.income) * 100);
		} else {
			data.percentage = -1;
		}
	}


	function calculatePercentages() {
		// iterate each expense
		data.allItems.expense.forEach(expObj => {
			expObj.calculatePercentage(data.totals.income);
		});
		
	}


	function getBudget() {
		return {
			budget: data.budget,
			totalIncome: data.totals.income,
			totalExpense: data.totals.expense,
			percentage: data.percentage
		}
	}


	function getPercentages() {
		// return an array of percentages
		return data.allItems.expense.map(expObj => expObj.percentage);
	}



	return {
		addItem,
		deleteItem,
		calculateBudget,
		calculatePercentages,
		getBudget,
		getPercentages
	};

})();


// USER INTERFACE CONTROLLER
const UIController = (() =>  {
	let LANG; // current language object

	const DOMElems = {
		headTitle: document.querySelector('title'),
		budgetTitleLabel: document.querySelector('.budget__title--text'),
		budgetTitleDate: document.querySelector('.budget__title--date'),
		budgetValueLabel: document.querySelector('.budget__value'),
		budgetIncomeTextLabel: document.querySelector('.budget__income--text'),
		budgetIncomeValueLabel: document.querySelector('.budget__income--value'),
		budgetIncomePercentageLabel: document.querySelector('.budget__income--percentage'),
		budgetExpensesTextLabel: document.querySelector('.budget__expenses--text'),
		budgetExpensesValueLabel: document.querySelector('.budget__expenses--value'),
		budgetExpensePercentageLabel: document.querySelector('.budget__expenses--percentage'),
		form: document.forms[0],
		inputType: document.querySelector('.add__type'),
		inputDescription: document.querySelector('.add__description'),
		inputValue: document.querySelector('.add__value'),
		inputBtn: document.querySelector('.add__btn'),
		bottom: document.querySelector('.bottom'),
		container: document.querySelector('.container'),
		incomeContainer: document.querySelector('.income'),
		incomeContainerTitle: document.querySelector('.income__title'),
		incomeList: document.querySelector('.income__list'),
		expensesContainer: document.querySelector('.expenses'),
		expensesContainerTitle: document.querySelector('.expenses__title'),
		expensesList: document.querySelector('.expenses__list')
	};


	function displayLanguage(langObj) {
		LANG = langObj; // assign a global variable

		DOMElems.headTitle.textContent = LANG.title;
		DOMElems.budgetTitleLabel.textContent = LANG.budget.title;
		DOMElems.budgetIncomeTextLabel.textContent = LANG.incomeTitle;
		DOMElems.budgetExpensesTextLabel.textContent = LANG.expensesTitle;
		DOMElems.inputDescription.placeholder = LANG.add.description;
		DOMElems.inputValue.placeholder = LANG.add.value;
		DOMElems.incomeContainerTitle.textContent = LANG.incomeTitle;
		DOMElems.expensesContainerTitle.textContent = LANG.expensesTitle;
	}


	function getInput() {
		return {
			type: DOMElems.inputType.value, // 'income' or 'expense'
			description: DOMElems.inputDescription.value.trim(),
			value: parseFloat(DOMElems.inputValue.value)
		};
	}

	/*
	this function checks if amount of items is bigger than 0,
	then it shows the container; otherwise it hides the container
	*/
	function showOrHideContainer() {
		let income, expeses, containers;

		income = DOMElems.incomeContainer;
		expeses = DOMElems.expensesContainer;

		containers = [income, expeses];

		// check each container for nessecity to be shown
		for (let cont of containers) {
			if (cont.querySelector('.item'))
				cont.classList.remove('hidden');
			else
				cont.classList.add('hidden');
		}

	}


	function addListItem(itemObj, type) {
		let itemElem, html, value, description;

		// format all the data
		value = formatNumber(itemObj.value, type);
		description = upperCaseFirst(itemObj.description);

		// create new item element
		itemElem = document.createElement('div');
		itemElem.classList.add('item');
		itemElem.id = type + '-' + itemObj.id;

		html = `<div class="item__description">${ description }</div><div class="item__text--wrapper"><div class="item__value">${ value }</div>%percentage%</div><button class="item__delete--btn">&#10005;</button><div class="item__delete--btn__trigger--right active"></div><div class="item__delete--btn__trigger--left"></div></div>`;

		// append item elem to appropriate container
		if (type === 'income') {
			itemElem.innerHTML = html.replace('%percentage%', '');
			DOMElems.incomeList.append(itemElem);

		} else if (type === 'expense') {
			itemElem.innerHTML = html.replace('%percentage%', '<div class="item__percentage">---</div>');
			DOMElems.expensesList.append(itemElem);
		}

		// 4. check if income/expenses container has to be shown or not
		showOrHideContainer();

	}


	function deleteListItem(item) {
		// 1. remove item from DOM
		item.remove();

		// 2. check if income/expense container has to be shown or not
		showOrHideContainer();

		//3. focus on description for a next input
		focusOnDescription();
	}


	function focusOnDescription() {
		DOMElems.inputDescription.focus();

		/*
		if this function calls from the transitionend event listener, 
		then remove the event listener as soon as it fired
		to prevent unnecessary firings after it worked out
		*/
		DOMElems.inputType.removeEventListener('transitionend', focusOnDescription);
	}


	function clearInputFields() {
		DOMElems.inputDescription.value = '';
		DOMElems.inputValue.value = '';

		// focus on the description field for the next item
		focusOnDescription();
	}


	function displayBudget(budgetObj) {
		let budget = budgetObj.budget,
			income = budgetObj.totalIncome,
			expense = budgetObj.totalExpense;

		budget = (budget < 0) ?
		formatNumber(budget, 'expense') :
		formatNumber(budget, 'income');

		income = formatNumber(income, 'income');
		expense = formatNumber(expense, 'expense');

		DOMElems.budgetValueLabel.innerHTML = budget;
		DOMElems.budgetIncomeValueLabel.innerHTML = income;
		DOMElems.budgetExpensesValueLabel.innerHTML = expense;

		if (budgetObj.percentage > 0) {
			// display the same on invisible income percentage to justify both labels
			DOMElems.budgetExpensePercentageLabel.textContent = DOMElems.budgetIncomePercentageLabel.textContent = budgetObj.percentage + '%';

		} else {
			// display the same on invisible income percentage to justify both labels
			DOMElems.budgetExpensePercentageLabel.textContent = DOMElems.budgetIncomePercentageLabel.textContent = '---';
		}

	}


	function displayPercentages(percentages) {
		let DOMList, DOMListArr;

		DOMList = DOMElems.expensesContainer.querySelectorAll('.item__percentage');
		DOMListArr = Array.from(DOMList);

		DOMListArr.forEach((item, i) => {
			// we need to get 'i' to be able to take percentages[i]
			if (percentages[i] > 0) {
				item.textContent = percentages[i] + '%';
			} else {
				item.textContent = '---';
			}
		});
	}


	function formatNumber(number, type) {
		/*
		Rules of formatting:
		1. always 2 decimal points
		2. + or - before a number
		3. comma to separate the thousands
		 */
		let fixed, int, decim, intCommas, formattedInt, result;

		// rule 1:
		fixed = number.toFixed(2);

		// rule 3:
		// save decimal part for the future
		[int, decim] = fixed.split('.');

		// reverse int part
		int = int.split('').reverse().join('');

		// add comma every 3 digits
		// regexp also removes '-' sign if it exists
		intCommas = int.match(/\d{1,3}/g).join(',');

		// reverse new string with commas
		formattedInt = intCommas.split('').reverse().join('');
		
		result = formattedInt + '.' + decim;

		if (type === 'income') {
			return '+' + result;
		} else if (type === 'expense') {
			return '&#8722;' + result;
		}
	}

	// returns a string with capital first letter
	function upperCaseFirst(str) {
		return str[0].toUpperCase() + str.slice(1);
	}


	function getFormattedDate() {
		let date, month, year;

		date = new Date();
		month = date.getMonth();
		year = date.getFullYear();;

		return LANG.budget.months[month] + ' ' + year;
	}


	function displayDate() {
		DOMElems.budgetTitleDate.textContent = getFormattedDate();
	}


	function toggleInputColor() {
		DOMElems.form.classList.toggle('red');
	}


	function focusOnInvalidInput() {
		/*
		I M P O R T A N T !
		This function looks for the first elem with 'invalid' class
		to focus on it.
		So, if we wouldn't use the timer in showInvalidInput function,
		this function wouldn't find 'invalid' class,
		because it would be removed at that time
		*/
		DOMElems.form.querySelector('.invalid').focus();
	}


	function showInvalidInput(field) {
		let timer; // we need timeout to remove 'invalid' class from the field

		// 1. highlight the invalid field
		if (field === 'description') {
			DOMElems.inputDescription.classList.toggle('invalid');

			timer = setTimeout(() => {
				DOMElems.inputDescription.classList.toggle('invalid');
				clearTimeout(timer);
			}, 400);

		} else if (field === 'value') {
			DOMElems.inputValue.classList.toggle('invalid');

			timer = setTimeout(() => {
				DOMElems.inputValue.classList.toggle('invalid');
				clearTimeout(timer);
			}, 400);
		}

		// 2. focus on it
		focusOnInvalidInput();
	}


	function mouseMoveHandler(event) {
		let target, item, triggers = {};

		target = event.target.closest('.item__delete--btn__trigger--right');
		if (!target) return;

		// we are here because mouse is on a right trigger
		item = target.closest('.item');

		// get both triggers for working with them
		triggers.right = target;
		triggers.left = item.querySelector('.item__delete--btn__trigger--left');

		toggleTriggers();


		function toggleTriggers() {
			triggers.left.classList.add('active');
			triggers.right.classList.remove('active');

			item.classList.add('hover');

			// add event listeners
			triggers.left.addEventListener('mouseenter', resetAll);
			item.addEventListener('mouseleave', resetAll);
		}


		function resetAll() {
			triggers.right.classList.add('active');
			triggers.left.classList.remove('active');

			item.classList.remove('hover');

			// remove all event listeners
			triggers.left.removeEventListener('mouseenter', resetAll);
			item.removeEventListener('mouseleave', resetAll);
		}
	}


	return {
		DOMElems,
		displayLanguage,
		getInput,
		addListItem,
		deleteListItem,
		focusOnDescription,
		clearInputFields,
		displayBudget,
		displayPercentages,
		displayDate,
		toggleInputColor,
		showInvalidInput,
		mouseMoveHandler
	}

})();


// GLOBAL CONTROLLER
const controller = ((budgetCtrl, UICtrl, lang) => {

	function init() {
		let LANG;

		LANG = setupLanguage();

		UICtrl.displayLanguage(LANG);

		UICtrl.displayDate();

		UICtrl.displayBudget({
			budget: 0,
			totalIncome: 0,
			totalExpense: 0,
			percentage: -1
		});

		UICtrl.focusOnDescription();

		setupEventListeners();
	}


	function setupLanguage() {
		let search, ln;

		// get language from URL (?lang=ru)
		search = window.location.search.toLowerCase().slice(1);
		ln = search.split('=')[1];

		return (ln === 'ru') ? lang.ru : lang.en;
	}


	function setupEventListeners() { 
		const DOMElems = UICtrl.DOMElems;

		DOMElems.form.addEventListener('submit', event => {
			event.preventDefault();
			ctrlAddItem();
		});

		DOMElems.inputValue.addEventListener('invalid', event => {
			event.preventDefault();
			UICtrl.showInvalidInput('value');
		});

		DOMElems.container.addEventListener('click', event => {
			if (event.target.closest('.item__delete--btn')) {
				ctrlDeleteItem(event.target.closest('.item'));
			}
		});

		DOMElems.inputType.addEventListener('change', () => {
			UICtrl.toggleInputColor();
			// focus on description input only after inputType border color transition has ended
			// create event listener for this
			DOMElems.inputType.addEventListener('transitionend',
				UICtrl.focusOnDescription);
		});
		
		DOMElems.inputValue.addEventListener('keydown', event => {
			// although this input field has type 'number',
			// it allows to enter 'e' char, what we don't want
			// 'e'.keyCode = 69
			if (event.keyCode === 69 && !(event.metaKey || event.altKey || event.ctrlKey)) {
				event.preventDefault();
			}
		});

		DOMElems.container.addEventListener('mousemove', UICtrl.mouseMoveHandler);
	}


	function updateBudget() {

		// 1. calculate the budget
		budgetCtrl.calculateBudget();

		// 2. return the budget
		let budget = budgetCtrl.getBudget();

		// 3. display the budget on the UI
		UICtrl.displayBudget(budget);

	}


	function updatePercentages() {

		// 1. calculate all percentages
		budgetCtrl.calculatePercentages();

		// 2. return percentages
		let percentages = budgetCtrl.getPercentages();

		// 3. update percentages on the UI
		UICtrl.displayPercentages(percentages);

	}


	function ctrlAddItem() {
		let input, newItem;

		// 1. get input data
		input = UICtrl.getInput();

		// 2. validate input data
		if (!validateInput(input)) return;

		// we are here if the input data is OK
		// 3. add the data to the budget controller
		newItem = budgetCtrl.addItem(input.type, input.description, input.value);

		// 4. add a new item to the UI controller
		UICtrl.addListItem(newItem, input.type);

		// 5. clear input fields
		UICtrl.clearInputFields();

		// 6. calculate and update budget
		updateBudget();

		// 7. update expense percentages
		updatePercentages();



		function validateInput(input) {
			let valueTest, descriptionTest;

			// 1. check input description
			descriptionTest = /^[\w\sёа-я,\.]+$/i.test(input.description);
			// if wrong, then show error message
			if (!descriptionTest) {
				UICtrl.showInvalidInput('description');
			}

			// 2. check input value
			valueTest = /^[\d.]+$/.test(input.value);
			// if wrong, then show error message
			if (!valueTest) {
				UICtrl.showInvalidInput('value');
			}

			// returns true only if both are true
			return descriptionTest && valueTest;
		}
	}


	function ctrlDeleteItem(item) {
		let splitId, type, id;

		// 1. delete item from the budget data
		splitId = item.id.split('-');
		type = splitId[0];
		id = parseInt(splitId[1]);
		budgetCtrl.deleteItem(type, id);

		// 2. delete item from the UI
		UICtrl.deleteListItem(item);

		// 3. update budget
		updateBudget();

		// 4. update expense percentages
		updatePercentages();

	}


	return {
		init
	};

})(budgetController, UIController, lang);

// run our Budget app
controller.init();





