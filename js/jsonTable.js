(function ($) {
	$(document).ready(function(){
		$.widget( "slomek.jsonTable", {

			table : null,

			columnMap: {},

			options: {
				columns: [],
				data: [],
				cssHeader: {},
				cssCells: { border: '1px solid gray'},
				selectable: false,
				rowSelect: $.noop,
				rowSelectOnSelectAll: true,
				pagination: false
			},

			paginationInfo: {
				// container, panelElement, allData, allDataSize, allPagesSize, pageInfo, itemsInfo,
				current: {},
				refreshPanel: function() {
					$('#prevPageBtn', this.element).css('opacity', this.isPrevPageAvailable() ? 1 : 0.5);
					$('#nextPageBtn', this.element).css('opacity', this.isNextPageAvailable() ? 1 : 0.5);
					$('#pageInput', this.element).val(this.pageInfo.current);
					$('#paginationInfo', this.element).text(this.printPageInfo() + " " + this.printItemsInfo());
				},
				isPrevPageAvailable: function() {
					return this.current.page > 0; 
				},
				isNextPageAvailable: function() {
					return this.current.page < this.allPagesSize-1; 
				},
				setPageInfo: function(firstElement) {
					this.current.page = Math.floor( firstElement / this.itemsPerPage );
					this.pageInfo = {
						current: this.current.page + 1,
						total: this.allPagesSize
					}
				},
				setItemsInfo: function(first, last) {
					this.current.first = first;
					this.current.last = last;
					this.itemsInfo = {
						first: first+1,
						last: last,
						total: this.allDataSize
					}
				},
				nextPage: function() {
					this.loadPart(this.current.last);
				},
				prevPage: function() {
					this.loadPart(this.current.first - this.itemsPerPage);
				},			
				loadPart: function(first) {
					var last = Math.min(this.allDataSize, first + this.itemsPerPage);
					this.widget.updateData(this.allData.slice(first, last));
					this.setPageInfo(first);
					this.setItemsInfo(first, last);
					this.refreshPanel();
				},
				printPageInfo: function() {
					return " z " + this.pageInfo.total;
				},
				printItemsInfo: function() {
					return "(Zmienne " + this.itemsInfo.first + "-" + this.itemsInfo.last + " z " + this.itemsInfo.total + ")";
				}
			},

			_create: function() {
				this._mapColumns();
				this._renderTable();
				this._renderHeader();
				this._renderBody();
				this._renderPagination();
				this._postRender();
			},

			_postRender: function() {
				if(this.options.draggableSort) {
					this.element.find('tbody').sortable({
						handle: '.draggableSort',
						placeholder: "ui-state-highlight",
						start: function(evt,ui) {
							var cells = ui.item.find('td');
							$.each(cells, function(i, c){
								console.log($(c).width());
							});
						}
					})
				}
			},

			_mapColumns: function() {
				var _this = this;
				this.columnMap = {};
				$.each(this.options.columns, function(index, column) {
					var columnName = _this._getColumnField(column);
					_this.columnMap[columnName] = (index + (_this.options.selectable ? 1 : 0));
				});
			},

			_renderTable: function() {
				this.element.addClass('jsonTableContainer');
				this.table = $('<table>')
						.addClass('jsonTable')
						.appendTo(this.element);
			},

			_renderHeader: function() {
				var _this = this;
				var header = $('<thead>');
				var headerRow = $('<tr>')
						.addClass('headerRow')
						.css(this.options.cssHeader)
						.appendTo(header);
				this._renderHeaderSelect(headerRow);
				$.each(this.options.columns, function(index, c) {
					$('<th>')
						.html(_this._getColumnName(c))
						.prop('id', _this.element.prop('id') + '_' + c.name)
						.data('sortField', c.name)
						.css(c.css || {})
						.appendTo(headerRow);
				});
				this._renderSortHandle(headerRow);
				header.appendTo(this.table);

				header
					.before(header.addClass('fixedHeader').clone())
					.css("width", header.width())
					.removeClass('fixedHeader')
					.addClass("floatingHeader");

				// $(window)
				this._getParentContainer()
					.scroll(function(){_this._updateHeader();})
					.trigger("scroll");

				$('.fixedHeader .selectAll')
					.click(function(){
						var value = $(this).prop('checked');
						$('.dataRow .select', _this.table).prop('checked', value);
						if(_this.options.rowSelectOnSelectAll) {
							$('.dataRow', _this.table).each(function(index, row){
								_this.options.rowSelect($(row), value);
							});
						}
						_this._setAllSelected();
					});
			},

			_getParentContainer: function() {
				var candidate = this.element.parent();

				return candidate.is('body') ? $(window) : candidate;
			},

			_updateHeader: function() {
				var el = this.element,
					offset = el.offset(),
					scrollTop = $(this._getParentContainer()).scrollTop(),
					floatingHeader = $(".floatingHeader", el),
					columnsCount = $('th', floatingHeader).length;


				for (var i = 0; i < columnsCount; i++) {
					$('.floatingHeader th:nth('+i+')').width($('.fixedHeader th:nth('+i+')').width());
				};

				if ((scrollTop > offset.top) && (scrollTop < offset.top + el.height())) {
		           floatingHeader.css({
		            "visibility": "visible"
		           });
		       } else {
		           floatingHeader.css({
		            "visibility": "hidden"
		           });      
		       };
			},

			_renderHeaderSelect: function(headerRow){
				var _this = this;
				if (this.options.selectable) {
					var selectAllCbx = $('<input>')
						.addClass('selectAll')
						.prop({
							'type': 'checkbox',
							'checked': _this.options.selectable.init || false
						})
						.click(function(){
							var value = $(this).prop('checked');
							$('.dataRow .select', _this.table).prop('checked', value);
							if(_this.options.rowSelectOnSelectAll) {
								$('.dataRow', _this.table).each(function(index, row){
									_this.options.rowSelect($(row), value);
								});
							}
							_this._setAllSelected();
						});
					$('<th>')
						.css(_this.options.selectable.columnCss || {})
						.append(selectAllCbx)
						.appendTo(headerRow);
				}
			},

			_renderSelect: function(row) {
				var _this = this;
				if(this.options.selectable){
					var initSelected = row.data('item').selected || _this.options.selectable.init || false;
					var cbx = $('<input>')
							.addClass('select')
							.prop({
								'type': 'checkbox',
								'checked': initSelected
							})
							.change(function(){
								var value = $(this).prop('checked');
								$(row).data('item').selected=value;
								_this.options.rowSelect($(row), value);
								_this._setAllSelected();
							});
					$('<td>')
						.addClass('selectCell')
						.append(cbx)
						.appendTo(row);

					row.data('item').selected = initSelected;
				}
			},

			_renderSortHandle: function(row) {
				var _this = this;
				if(this.options.draggableSort){
					var icon = $('<span>').addClass('ui-icon ui-icon-arrowthick-2-n-s');
					$('<td>')
						.addClass('draggableSort')
						.css({
							'width': '25px',
							'text-align': 'center'
						})
						.append(icon)
						.appendTo(row);
				}	
			},

			_setAllSelected: function() {
				var selectedCount = $('.select:checked', this.table).length;
				var allCount = $('.select', this.table).length;
				var ratio = selectedCount/allCount;
				var selectAllCbx = $('.selectAll', this.table);
				if(ratio == 0 || ratio == 1) {
					selectAllCbx.prop('checked', ratio == 1);
					selectAllCbx.prop('indeterminate', false);
				} else {
					selectAllCbx.prop('indeterminate', true);
				}
			},

			_renderBody: function() {
				var _this = this;
				var body = $('<tbody>')
						.addClass('body');

				$.each(this.options.data, function(index, item) {
					var row = $('<tr>')
							.addClass('dataRow')
							.appendTo(body)
							.data('item', item);

					_this._renderSelect(row);
					$.each(_this.options.columns, function(index, c){
						var columnField = _this._getColumnField(c);
						var columnWidth = _this._getColumnWidth(index);
						var value = _this._getItemsValue(item, columnField);						
						console.log(index, columnWidth);
						$('<td>')
							.html(value)
							.click(function(){
								(c.onclick || $.noop)(value, c, item);
							})
							.css('width', columnWidth)
							.appendTo(row);
					});
					_this._renderSortHandle(row);
				});
				body.appendTo(this.table);				

				if(this.options.cssCells){
					$('td', body).css(this.options.cssCells);				
				}				
			},

			_getColumnWidth: function(index) {
				var offset = this.options.selectable ? 1 : 0;
				return $(this.element.find('th')[index + offset]).width();
			},

			_renderPagination: function() {
				if(this.options.pagination) {
					this.paginationInfo.widget = this;

					var _this = this;
					var footer = $('<div>')
							.addClass('pagination');

					this.paginationInfo.itemsPerPage = this.options.pagination.itemsPerPage;
					this.paginationInfo.allData = this.options.data;
					this.paginationInfo.allDataSize = this.paginationInfo.allData.length;
					this.paginationInfo.allPagesSize = Math.ceil(this.paginationInfo.allDataSize / this.options.pagination.itemsPerPage);

					console.log('this.paginationInfo.allDataSize ', this.paginationInfo.allDataSize)
					console.log('this.paginationInfo.allPagesSize ', this.paginationInfo.allPagesSize)

					// console.log(this.options.pagination.itemsPerPage);

					footer.appendTo(this.element);

					renderButtons();
					this.paginationInfo.loadPart(0);
				}

				function renderButtons() {
					// var _this = this;

					$('<span>')
						.prop('id', 'prevPageBtn')
						.addClass('button2_element no_selection')
						.text('Poprzednia')
						.unbind('click')
						.click(function() {
							if(_this.paginationInfo.isPrevPageAvailable()) {
								_this.paginationInfo.prevPage();
							}				
						})
						.appendTo($('.pagination', _this.element));

					$('<span>')
						.prop('id', 'nextPageBtn')
						.addClass('button2_element no_selection')
						.text('Następna')
						.unbind('click')
						.click(function() {
							if(_this.paginationInfo.isNextPageAvailable()){
								_this.paginationInfo.nextPage();	
							}
						})
						.appendTo($('.pagination', _this.element));

					$('<span>')
						.text('Strona ')
						.appendTo($('.pagination', _this.element));

					$('<input>')
						.prop({
							id: 'pageInput',
							type: 'text'
						})
						.css('width', '20px')
						.text('Następna')
						.unbind('input')
						.bind('input', function() {
							var newPageNo = parseInt($j(this).val());
							if(newPageNo > 0 && newPageNo < allPagesSize-1) {
								_this.paginationInfoloadPage(newPageNo);
							}
						})
						.appendTo($('.pagination', _this.element));

					$('<span>')
						.prop('id', 'paginationInfo')
						.appendTo($('.pagination', _this.element));					
				}				
			},

			_getItemsValue: function(item, columnField, specificFormatter) {
				var formatter = specificFormatter || function(v){return v;};
				if(columnField.indexOf('>') == -1) {
					return formatter(item[columnField], item);
				} else {
					var parts = columnField.split('>');
					var primary = parts[0];
					var secondary = parts[1];
					return formatter(item[primary][secondary], item);
				}
			},

			_getColumnName: function(column) {
					if(typeof column ==='string') {
						return column;
					} else {
						if(column.display && typeof column.display === 'function'){
							return column.display();
						}
						return column.display || column.name;
					}
				},

			_getColumnField: function(column) {
				if(typeof column ==='string') {
					return column;
				} else {
					return column.name;
				}
			},

			_destroy: function() {
				$('table', this).remove();
			},

			_setOptions: function( options ) {
			},

			_setOption: function( key, value ) {
			},

			getSelectedRows: function(){
				return $('.dataRow', this.table).filter(function(){
					return $('.select', this).prop('checked');
				});

			},

			getSelected: function() {
				return this.getSelectedRows().map(function(index, row){
					return $(row).data('item');
					});
			},
	
			getData: function() {
				var dataArray = [];
				$('.dataRow', this.table).each(function(index, row){
					dataArray.push($(row).data('item'));
				});
				return dataArray;

			},

			getSelected: function() {
				return this.getSelectedRows().map(function(index, row){
					return $(row).data('item');
					});
			},
	
			getRow: function(index, value) {
				if(typeof index === 'number') {
					var zeroBasedIndex = index+1;
					return $('.dataRow:nth-of-type('+zeroBasedIndex+')', this.table);
				} else {
					var property = index;
					return $('.dataRow', this.table).filter(function(index, el) {
						   return $(el).data('item')[property]==value;
						}).first() || null;
				}
			},

			updateValue: function(rowId, columnName, value, updateItem) {
				var row = this.getRow(rowId);
				var zeroBasedColId = this.columnMap[columnName]+1;
				$('td:nth-of-type('+zeroBasedColId+')', row).text(value);
			},

			updateData: function(newData, place) {
				$('tbody', this.element).remove();
				if(!place || place === 'instead') {
					this.options.data = newData;
					this._renderBody();
					this._setAllSelected();
				} else if(place === 'start') {
					var data = this.options.data, data2 = [];
					$.each(newData, function(index, it){
					    data2.push(it);
					});
					$.each(data, function(index, it){
                        data2.push(it);
                    });
					this.updateData(data2);
				} else if(place === 'end') {
					var data = this.options.data, data2 = [];
					$.each(data, function(index, it){
                        data2.push(it);
                    });
                    $.each(newData, function(index, it){
                        data2.push(it);
                    });
                    this.updateData(data2);
				}
			},

			sort: function(field, order) {
				var data = this.options.data;
				var dir;
				if(!order || order === 'asc') {
					dir = 1;
				} else {
					dir = -1;
				}
				var data = this.options.data.sort(
						function(f,s){
							if(f[field]>s[field]) {
								 return 1*dir;
							} else if(f[field]<s[field]) {
								 return -1*dir;
							} else {
								return 0; 
							}
						});
				this.updateData(data);
			}	

		});
	});
})(jQuery);
