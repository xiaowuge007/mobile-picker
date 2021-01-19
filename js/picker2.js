(function () {
	var transformProperty = getTransformProperty();
	var liHight = 42;

	function Picker(option) {
		this.el = option.el;
		this.isMove = false;
		this.interlock = !Array.isArray(option.data);
		this.isDate = option.isDate;
		this.isPm = option.isPm || false;
		this.is3D = option.is3D || false;
		if (!this.isDate) {
			if (this.interlock) {
				this.lockData = option.data.data;
				this.data = []
			} else {
				this.data = option.data;
			}
		} else {
			this.format = option.format || 'yyyy-MM-dd';
			this.maxIndex = getFormat(this.format);
			this.minYear = parseInt(option.minYear) || 1980;
			this.maxYear = parseInt(option.maxYear) || 2050;
			this.dateValue = option.value ? formatDate(option.value, this.format) : formatDate(new Date(), this.format);
			var _val = this.dateValue.match(/(\d+)/g);
			this.data = getAllData(_val, this.minYear, this.maxYear);
			if (this.isPm) {
				this.data.push([{id: 'am', text: '上午'}, {id: 'pm', text: '下午'}])
				var hours = new Date().getHours();
				var _text = hours > 11 ? 'pm' : 'am';
				_val.push(_text);
			}
			option.value = transDateVal(_val);
		}
		var self = this;
		this.selectData = [];
		var obj = {
			el_trans: liHight * 2,
			sy: 0,
			ey: 0,
			max_h: 0,
			min_h: liHight * 2,
			pre_y: 0,
			start_x: 0,
			start_time: 0,
			dm: 0,
			li_h: liHight
		}
		this.addEvent = function () {
			//监听
			this.el.addEventListener('click', showDialog, false);
			//监听按钮事件
			this.cancelEl.addEventListener('click', cancelEvent, false)
			this.sureEl.addEventListener('click', sureEvent, false)
			this.addScrollEvent()
		}
		this.addScrollEvent = function () {
			//监听滚动事件
			this.selectGroup.forEach(function (val) {
				val.el.addEventListener('touchstart', touchEvent, false)
				val.el.addEventListener('touchmove', touchEvent, false)
				val.el.addEventListener('touchend', touchEvent, false)
			})
		}
		this.removeScrollEvent = function (arr) {
			arr.forEach(function (val) {
				val.el.removeEventListener('touchstart', touchEvent, false)
				val.el.removeEventListener('touchmove', touchEvent, false)
				val.el.removeEventListener('touchend', touchEvent, false)
				val.el.remove();
			})
		}
		this.destroy = function () {
			this.el.removeEventListener('click', showDialog, false);
			this.selectGroup.forEach(function (val) {
				val.el.removeEventListener('touchstart', touchEvent, false)
				val.el.removeEventListener('touchmove', touchEvent, false)
				val.el.removeEventListener('touchend', touchEvent, false)
			})
			this.cancelEl.removeEventListener('click', cancelEvent, false)
			this.sureEl.removeEventListener('click', sureEvent, false)
			this.dialogEl.remove();
		}
		this.init(option);

		function touchEvent(e) {
			var type = e.type;
			var target = e.touches[0];
			var index = parseInt(this.getAttribute('picker-index'));
			if (type === 'touchstart') {
				if (self.isMove) {
					return;
				}
				self.isMove = true;
				obj.el_trans = self.getTranslate(this).top;
				obj.max_h = -(self.selectGroup[index].num - 3) * obj.li_h;
				removeClass(this, 'amanite');
				obj.start_x = target.pageY;
				obj.start_time = new Date();
				obj.sy = target.pageY;
			} else if (type === 'touchmove') {
				obj.ey = target.pageY;
				var cur_y = obj.el_trans + obj.ey - obj.sy;
				var move_y;
				if (cur_y > obj.min_h) {
					move_y = obj.min_h + elasticitySum(cur_y - obj.min_h);
				} else if (cur_y < obj.max_h) {
					move_y = obj.max_h - elasticitySum(obj.max_h - cur_y);
				} else {
					move_y = cur_y;
				}
				this.style[transformProperty] = 'translate3d(' + 0 + 'px,' + parseInt(move_y) + 'px,' + 0 + 'px)';
				//设置3d变形
				self.transform3D(index);

				//滑动力度
				obj.dm = target.pageY - obj.start_x;
				obj.start_x = target.pageY;
			} else if (type === 'touchend') {
				var time = new Date() - obj.start_time;
				addClass(this, 'amanite');
				self.inertanceScroll(this, time, obj, index)
			}
		}

		function cancelEvent(e) {
			self.hide();
		}

		function sureEvent() {
			self.hide(true);
			if (self.isDate) {
				self.dateValue = self.selectData.reduce(function (pre, cur, index, arr) {
					if (index === 0) {
						pre = cur.id;
					} else if (index === 3) {
						pre = pre + ' ' + cur.id
					} else if (index === 1 || index === 2) {
						pre = pre + '-' + cur.id
					} else if (index < arr.length && index > 3) {
						pre = pre + ':' + cur.id
					}
					return pre;
				}, '')
			}
			if (option.callBack && typeof option.callBack === 'function') {
				if (self.isDate) {
					option.callBack(self.dateValue)
				} else {
					option.callBack(self.selectData)
				}
			}
		}

		function showDialog() {
			self.show()
		}
	}

	Picker.prototype.init = function (option) {
		let self = this;
		this.dialogEl = document.createElement('div');
		if (option.class) {
			addClass(this.dialogEl, option.class);
		}
		addClass(this.dialogEl, 'mb-picker-dialog');
		this.box = document.createElement('div');
		addClass(this.box, 'mb-picker-box');
		var pickerHead = document.createElement('div');
		this.cancelEl = document.createElement('span');
		this.cancelEl.textContent = option.cancelText || '取消';
		if (option.cancelClass) {
			addClass(this.cancelEl, option.cancelClass);
		}
		this.sureEl = document.createElement('span');
		this.sureEl.textContent = option.sureText || '确认';
		if (option.sureClass) {
			addClass(this.sureEl, option.sureClass);
		}
		var pickerTitle = document.createElement('div');
		pickerTitle.textContent = option.title || '';
		var pickerBody = document.createElement('div');
		var pickerLine = document.createElement('div');
		this.pickergroup = document.createElement('div');
		addClass(pickerTitle, 'mb-picker-title');
		addClass(pickerHead, 'mb-picker-header');
		addClass(this.cancelEl, 'mb-picker-cancel');
		addClass(this.sureEl, 'mb-picker-sure');
		addClass(pickerBody, 'mb-picker-body');
		addClass(pickerLine, 'mb-picker-line');
		addClass(this.pickergroup, 'mb-picker-group');
		pickerHead.appendChild(this.cancelEl)
		pickerHead.appendChild(this.sureEl)
		pickerHead.appendChild(pickerTitle);
		pickerBody.appendChild(pickerLine)
		pickerBody.appendChild(this.pickergroup)
		this.box.appendChild(pickerHead);
		this.box.appendChild(pickerBody);
		this.selectGroup = [];
		if (this.interlock && !this.isDate) {
			this.lockCreate(option, this.lockData)
		} else {
			this.commonCreate(option)
		}
		//判断是否为3d设置为绝对定位
		this.setAbsolute();
		//监听事件滚动事件
		this.addEvent();
		this.dialogEl.appendChild(this.box)
		document.body.appendChild(this.dialogEl);
	}
	Picker.prototype.setAbsolute = function (index) {
		if (!this.is3D) {
			return;
		}
		var self = this;
		if (index !== undefined && index !== '' && index !== null) {
			var childs = this.selectGroup[index].el.children;
			for (var i = 0; i < childs.length; i++) {
				childs[i].style.top = i * liHight + 'px';
			}
		} else {
			this.selectGroup.forEach(function (group,index) {
				self.setAbsolute(index);
			})
		}
	}
	Picker.prototype.initValue = function (val) {
		var self = this;
		val.forEach(function (val, index) {
			var num = self.getItemIndex(val, self.data[index]);
			self.scrollIndex(index, num)
		})
		this.selectData = val;
	}
	Picker.prototype.commonCreate = function (option) {
		var self = this;
		this.data.forEach(function (val, index) {
			var pickerItems = document.createElement('div');
			pickerItems.setAttribute('picker-index', index)
			addClass(pickerItems, 'mb-picker-items');
			if (self.is3D) {
				addClass(pickerItems, 'preserve-3d');
			}
			for (var i = 0; i < val.length; i++) {
				var pickerItem = document.createElement('div');
				pickerItem.textContent = val[i].text;
				addClass(pickerItem, 'mb-picker-item');
				pickerItems.appendChild(pickerItem);
			}
			self.pickergroup.appendChild(pickerItems);
			self.selectGroup.push({
				el: pickerItems,
				num: val.length
			})
			pickerItems.style[transformProperty] = 'translate3d(' + 0 + 'px,' + parseInt(liHight * 2) + 'px,' + 0 + 'px)';
			addClass(pickerItems.children[0], 'active')
			self.selectData.push(val[0])
		})
		if (option.value) {
			self.initValue(option.value);
		}
		//设置3d变形
		self.transform3D();
	}
	Picker.prototype.lockCreate = function (option, data, level, flag) {
		var pickerItems = document.createElement('div');
		if (!level) {
			level = 0;
		}
		pickerItems.setAttribute('picker-index', level);
		level++;
		addClass(pickerItems, 'mb-picker-items');
		for (let i = 0; i < data.length; i++) {
			var pickerItem = document.createElement('div');
			pickerItem.textContent = data[i].text;
			addClass(pickerItem, 'mb-picker-item');
			pickerItems.appendChild(pickerItem);
		}
		pickerItems.style[transformProperty] = 'translate3d(' + 0 + 'px,' + parseInt(liHight * 2) + 'px,' + 0 + 'px)';
		addClass(pickerItems.children[0], 'active');
		this.pickergroup.appendChild(pickerItems);
		this.selectData.push({
			id: data[0].id,
			text: data[0].text
		})
		this.data.push(data);
		this.selectGroup.push({
			el: pickerItems,
			num: data.length
		})
		if (data[0].children) {
			this.lockCreate(option, data[0].children, level)
		}
		if (flag) {
			this.addScrollEvent()
		}
	}
	Picker.prototype.getTranslate = function (el) {

		var result = {left: 0, top: 0};
		if (el === null || el.style === null) return result;

		var transform = el.style[transformProperty];
		var matches = transform.match(/translate3d\((-?\d+)px,\s*(-?\d+)px,\s*(\d+)px\)/i);
		if (matches) {
			result.left = parseInt(matches[1]);
			result.top = parseInt(matches[2]);
		}

		return result;
	}
	Picker.prototype.scrollList = function (val, item, itemIndex) {
		var self = this;
		item.style[transformProperty] = 'translate3d(' + 0 + 'px,' + parseInt(val) + 'px,' + 0 + 'px)';
		var time = setTimeout(function () {
			self.isMove = false;
			clearTimeout(time);
			self.transform3D(itemIndex);
		}, 300)
		var index = this.getIndex(val);
		var children = item.children;
		//console.log(index)
		for (var i = 0; i < children.length; i++) {
			if (i !== index) {
				removeClass(children[i], 'active')
			} else {
				addClass(children[i], 'active')
			}
		}
		var value = this.getItemValue(itemIndex, index);
		this.setValue(itemIndex, value);
		this.isLockValue(itemIndex, index);
	}
	Picker.prototype.isLockValue = function (itemIndex, index) {
		//判断是否为联动
		if (this.interlock && !this.isDate) {
			if (this.data[itemIndex][index].children) {
				if (itemIndex < this.selectGroup.length - 1) {
					this.updateData(itemIndex + 1, this.data[itemIndex][index].children);
					this.scrollIndex(itemIndex + 1, 0)
					this.isLockValue(itemIndex + 1, 0);
				} else {
					this.lockCreate({}, this.data[itemIndex][index].children, itemIndex + 1, true)
				}
			} else {
				if (itemIndex < this.selectGroup.length - 1) {
					var curNum = itemIndex + 1;
					var preNum = this.selectGroup.length;
					this.data.splice(curNum, preNum - curNum);
					this.selectData.splice(curNum, preNum - curNum);
					var arr = this.selectGroup.splice(curNum, preNum - curNum);
					this.removeScrollEvent(arr);
				}
			}
		}
		//判断是否为日期（也联动）
		if (this.isDate) {
			//判断月份滑动
			if (this.maxIndex > 1 && itemIndex === 1) {
				var month = parseInt(this.data[itemIndex][index].id);
				if (month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) {
					if (this.selectGroup[itemIndex + 1].el.children.length != 31) {
						this.updateData(itemIndex + 1, getDate('dd', month))
					}
				} else if (month == 4 || month == 6 || month == 9 || month == 11) {
					if (this.selectGroup[itemIndex + 1].el.children.length != 30) {
						this.updateData(itemIndex + 1, getDate('dd', month))
					}
				} else if (month == 2) {
					if (this.selectGroup[itemIndex + 1].el.children.length != 28) {
						this.updateData(itemIndex + 1, getDate('dd', month, this.selectData[0].id))
					}
				}
			}
			//判断年份滑动
			if (itemIndex === 0 && this.maxIndex > 1) {
				if (this.selectData[1].id == 2) {
					this.updateData(itemIndex + 2, getDate('dd', 2, this.selectData[0].id));
				}
			}
		}
	}
	Picker.prototype.getIndex = function (val) {
		val = val - liHight * 2;
		var index = Math.round(val / liHight);
		return Math.abs(index);
	}
	Picker.prototype.getIndexTranlate = function (index) {
		return liHight * (2 - index);
	}
	Picker.prototype.inertanceScroll = function (item, time, obj, index) {
		// var friction = ((obj.dm >> 31) * 2 + 1) * 0.5;//根据力度套用公式计算出惯性大小,公式要记住
		// obj.dm -= friction;//力度按 惯性的大小递减
		var momentumRatio = 7;
		let currentTans = this.getTranslate(item).top;
		if (time < 300) {
			//快速滑动 增加动画效果

			currentTans = currentTans + momentumRatio * obj.dm;
		}
		if (currentTans < obj.max_h) {//如果列表底部超出了
			this.scrollList(obj.max_h, item, index);//回弹
			return;
		}
		if (currentTans > obj.min_h) {//如果列表顶部超出了
			this.scrollList(obj.min_h, item, index);//回弹
			return;
		}
		var num = Math.round(Math.abs(currentTans) / liHight);
		if (currentTans >= 0) {
			currentTans = liHight * num;
		} else {
			currentTans = -liHight * num;
		}
		this.scrollList(currentTans, item, index)
	}
	Picker.prototype.setValue = function (index, val) {
		this.selectData[index] = val;
	}
	Picker.prototype.getItemValue = function (itemIndex, liIndex) {
		var result = {
			text: '',
			id: ''
		}
		// for(var i = 0;i<this.data[itemIndex].length;i++){
		//     if(this.data[itemIndex][i].id === )
		// }
		result = this.data[itemIndex][liIndex];
		return result;
	}
	Picker.prototype.hide = function (flag) {
		var self = this;
		//判断是否为日期
		if (this.isDate && !flag) {
			var _val = transDateVal(this.dateValue.match(/(\d+)/g));
			_val.forEach(function (val, index) {
				if (val.id != self.selectData[index].id) {
					var _index = self.getItemIndex(val, self.data[index]);
					self.scrollList(self.getIndexTranlate(_index), self.selectGroup[index].el, index)
				}
			})
		}
		removeClass(this.box, 'show');
		addClass(self.dialogEl, 'hide');
		var timer = setTimeout(function () {
			removeClass(self.dialogEl, 'show');
			removeClass(self.dialogEl, 'hide');
			clearTimeout(timer)
		}, 200)
	}
	Picker.prototype.show = function () {
		addClass(this.dialogEl, 'show');
		addClass(this.box, 'show');
	}
	Picker.prototype.updateData = function (index, data) {
		if (!this.selectGroup[index]) {
			return false;
		}
		var el = this.selectGroup[index].el;
		var num = this.selectGroup[index].num;
		//获取选中值的下标
		var _index = this.getItemIndex(this.selectData[index], this.data[index])
		if (data.length >= num) {
			for (var i = 0; i < data.length; i++) {
				if (i < num) {
					el.children[i].textContent = data[i].text;
				} else {
					var item = document.createElement('div');
					item.textContent = data[i].text;
					addClass(item, 'mb-picker-item');
					el.appendChild(item);
				}
			}
		} else {
			for (var i = 0; i < num; i++) {
				if (i < data.length) {
					el.children[i].textContent = data[i].text;
				} else {
					el.children[data.length].remove();
				}
			}
			if (_index > data.length - 1) {
				_index = data.length - 1;
				removeClass(el, 'amanite');
				addClass(el.children[_index], 'active');
				var meter = this.getIndexTranlate(_index)
				el.style[transformProperty] = 'translate3d(' + 0 + 'px,' + parseInt(meter) + 'px,' + 0 + 'px)';
			}
		}
		this.selectGroup[index].num = data.length;
		this.data[index] = data;
		this.selectData[index] = data[_index];
		//设置3d
		this.setAbsolute(index);
		this.transform3D(index);
	}
	Picker.prototype.getItemIndex = function (val, data) {
		var index = 0;
		for (var i = 0; i < data.length; i++) {
			if (data[i].id === val.id) {
				index = i;
				break;
			}
		}
		return index;
	}
	Picker.prototype.scrollIndex = function (itemIndex, liIndex, flag) {
		if (!this.selectGroup[itemIndex]) {
			return;
		}
		var el = this.selectGroup[itemIndex].el;
		if (flag) {
			addClass(el, 'amanite');
		} else {
			removeClass(el, 'amanite');
		}
		if (liIndex > el.children.length - 1 || liIndex < 0) {
			return false;
		}
		var meter = this.getIndexTranlate(liIndex);
		el.style[transformProperty] = 'translate3d(' + 0 + 'px,' + parseInt(meter) + 'px,' + 0 + 'px)';
		for (var i = 0; i < el.children.length; i++) {
			if (i !== liIndex) {
				removeClass(el.children[i], 'active')
			} else {
				addClass(el.children[i], 'active')
			}
		}
		this.selectData[itemIndex] = this.data[itemIndex][liIndex];
	}
	Picker.prototype.transform3D = function (index) {
		if(!this.is3D) return;
		var self = this;
		if (index !== undefined && index !== '' && index !== null) {
			var vm = this.selectGroup[index].el;
			var distance = this.getTranslate(vm).top;
			var children = vm.children;
			var cur = this.getIndex(distance);
			for (var i = 0; i < children.length; i++) {
				removeClass(children[i], 'active');
				var deg = (cur - i) * 22;
				children[i].style[transformProperty] = 'translate3d(0px, 0px, 0px) rotateX(' + deg + 'deg)';
				if (i === cur) {
					addClass(children[i], 'active')
				}
			}
		} else {
			self.selectGroup.forEach(function (obj, index) {
				self.transform3D(index);
			})
		}
	}

//弹簧系数
	function elasticitySum(val) {
		return 150 / (150 + val) * val
	}

	function hasClass(elem, cls) {
		cls = cls || '';
		if (cls.replace(/\s/g, '').length == 0) return false; //当cls没有参数时，返回false
		return new RegExp(' ' + cls + ' ').test(' ' + elem.className + ' ');
	}

	function addClass(elem, cls) {
		if (!hasClass(elem, cls)) {
			elem.className = elem.className == '' ? cls : elem.className + ' ' + cls;
		}
	}

	function getTransformProperty() {
		var docStyle = document.documentElement.style;
		var engine;
		if (window.opera && Object.prototype.toString.call(opera) === '[object Opera]') {
			engine = 'presto';
		} else if ('MozAppearance' in docStyle) {
			engine = 'gecko';
		} else if ('WebkitAppearance' in docStyle) {
			engine = 'webkit';
		} else if (typeof navigator.cpuClass === 'string') {
			engine = 'trident';
		}
		var vendorPrefix = {trident: 'ms', gecko: 'Moz', webkit: 'Webkit', presto: 'O'}[engine];
		var transformProperty = vendorPrefix + 'Transform';
		return transformProperty;
	}

	function removeClass(elem, cls) {
		if (hasClass(elem, cls)) {
			var newClass = ' ' + elem.className.replace(/[\t\r\n]/g, '') + ' ';
			while (newClass.indexOf(' ' + cls + ' ') >= 0) {
				newClass = newClass.replace(' ' + cls + ' ', ' ');
			}
			elem.className = newClass.replace(/^\s+|\s+$/g, '');
		}
	}

//获取月份
	function getDate(type, month, year) {
		if (type === 'MM') {
			return getCommonDate(1, 12);
		} else if (type === 'dd') {
			var days = getCommonDate(1, 31);
			var day31 = [1, 3, 5, 7, 8, 10, 12];
			var day30 = [4, 6, 9, 11];
			if (day31.indexOf(month) !== -1) {
				return days;
			} else if (day30.indexOf(month) !== -1) {
				return days.splice(0, 30)
			} else if (month === 2) {
				//判断闰年还是平年
				if (year && year % 4 === 0) {
					return days.splice(0, 29);
				}
				return days.splice(0, 28);
			}
		} else if (type === 'hh') {
			return getCommonDate(0, 23);
		} else if (type === 'mm' || type === 'ss') {
			return getCommonDate(0, 59)
		}
	}

	function getCommonDate(min, max) {
		var res = [];
		for (var i = min; i <= max; i++) {
			res.push({
				id: i < 10 ? '0' + i : i.toString(),
				text: i < 10 ? '0' + i : i.toString()
			})
		}
		return res;
	}

//判断用户输入的格式
	function getFormat(str) {
		let arr = str.match(/[a-zA-Z]+/g);
		return arr.length - 1;
	}

//日期转化
	function formatDate(val, format) {
		if (typeof val === 'string') {
			val = new Date(val);
		}
		var date = {
			"M+": val.getMonth() + 1,
			"d+": val.getDate(),
			"h+": val.getHours(),
			"m+": val.getMinutes(),
			"s+": val.getSeconds(),
			"q+": Math.floor((val.getMonth() + 3) / 3),
			"S+": val.getMilliseconds()
		};
		if (/(y+)/i.test(format)) {
			format = format.replace(RegExp.$1, (val.getFullYear() + '').substr(4 - RegExp.$1.length));
		}
		for (var k in date) {
			if (new RegExp("(" + k + ")").test(format)) {
				format = format.replace(RegExp.$1, RegExp.$1.length == 1
					? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
			}
		}
		return format;
	}

	//获取日期数据
	function getAllData(arr, min, max) {
		let res = [];
		arr.forEach(function (val, index,) {
			if (index === 0) {
				res.push(getCommonDate(min, max))
			} else if (index === 1) {
				res.push(getDate('MM'))
			} else if (index === 2) {
				res.push(getDate('dd', parseInt(arr[index - 1])))
			} else if (index === 3) {
				res.push(getDate('hh'))
			} else if (index === 4) {
				res.push(getDate('mm'))
			} else if (index === 5) {
				res.push(getDate('ss'))
			}
		})
		return res;
	}

	//日期格式转化
	function transDateVal(arr) {
		var res = [];
		arr.forEach(function (val) {
			res.push({
				id: typeof val === 'string' ? val : val.toString(),
				text: typeof val === 'string' ? val : val.toString()
			})
		})
		return res;
	}

	if (typeof module != 'undefined' && module.exports) {
		module.exports = Picker;
	} else if (typeof define == 'function' && define.amd) {
		define(function () {
			return Picker;
		});
	} else {
		window.Picker = Picker;
	}
})()

