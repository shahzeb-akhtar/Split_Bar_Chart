/*
Creates an interactive Bar Chart - if bars are more than 12 and width of chart is more than height - the bars are shown in 2 columns
	input - objConfig with the following properties:
		divElement - d3 selection of div in which to creat chart
		dataArr - data to be charted
			'Name', 'Value' are required columns.
		title - Title for the chart
		topN - number of names to show - even if data contains more than topN values
		format - options - int, float, percent
*/
function SplitBar(configObj){
	let resizeTimer,
		mouseTimer,
		wSvg,
		hSvg,
		svgElem,
		isMobile = false,
		allNames = [],
		nameValueObj = {},
		topRank = 1,
		bottomRank = 0,
		scaleX = d3.scaleLinear(),
		scaleY = d3.scaleLinear(),
		parentResizeFunction,
		maxVal = 0,
		topTextElem,
		splitCase = false,
		marginPercent = {top:0.01, right:0.00, bottom:0.01, left:0.25};
	if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		isMobile = true;
	}	
	let divElement = configObj.divElement, // required 
			dataArr = configObj.dataArr, // required 
			title = 'Split Bar Chart', 
			topN = 30,
			barColor = d3.schemeCategory10[0],
			format;
			
			if(configObj.title){
				title = configObj.title;
			}
			if(configObj.topN){
				topN = configObj.topN;
			}
			if(configObj.barColor){
				barColor = configObj.barColor;
			}
			if(configObj.format){
				switch(configObj.format){
					case 'int':
						format = d3.format(",d");
						break;
					case 'float':
						format = d3.format(".2f");
						break;
					case 'percent':
						format = d3.format(".2%");
						break;
				}
			}
	
	divElement.style('font-family', 'Helvetica');
	
	// check if there is already a resize function
	if(d3.select(window).on('resize')){
		parentResizeFunction = d3.select(window).on('resize');
	}
	
	d3.select(window).on('resize', function(){
		if(resizeTimer){
			clearTimeout(resizeTimer);
		}
		resizeTimer = setTimeout(resize, 100);
		if(parentResizeFunction){
			parentResizeFunction();
		}
	});
	
	function resize(){
		// remove previous chart, if any
		divElement.selectAll("*").remove();
		let w = divElement.node().clientWidth,
			h = divElement.node().clientHeight,
			titleFontSize = h/25;
		
		if(titleFontSize > 32){
			titleFontSize = 32;
		}
		// append title
		let titleElement = divElement.append("h2").style("font-size", titleFontSize).text(title);
		
		// calculate width and height of svg
		wSvg = w;
		hSvg = h - titleElement.node().scrollHeight;

		if(wSvg < 100){
			wSvg = 100;
		}
		if(hSvg < 100){
			hSvg = 100;
		}
		if(wSvg > hSvg && bottomRank > 12){
			// split case
			splitCase = true;
			scaleX.range([marginPercent.left*wSvg*0.6, (wSvg/2)*(1 -  (marginPercent.right * 0.8))]);
			scaleY.domain([topRank, Math.ceil(bottomRank/2) + 1]);
		}else{
			splitCase = false;
			scaleX.range([marginPercent.left*wSvg, wSvg*(1 -  marginPercent.right)]);
			scaleY.domain([topRank, bottomRank + 1]);
		}
		scaleY.range([marginPercent.top*hSvg, hSvg*(1 - marginPercent.bottom)]);
		createChart();
	}
	
	function understandData(){
		dataArr.forEach(function(dd, di){
			if(allNames.indexOf(dd.Name) < 0){
				allNames.push(dd.Name);
			}
			if(dd.Value > maxVal){
				maxVal = dd.Value;
			}
			nameValueObj[dd.Name] = dd.Value;
		});
		allNames.sort(function(a,b){
			return nameValueObj[b] - nameValueObj[a];
		});
		if(allNames.length < topN){
			bottomRank = allNames.length;
		}else{
			bottomRank = topN;
		}
		scaleX.domain([0, maxVal]);		
	}
	
	function namesMouseOver(d){
		if(isMobile && mouseTimer){
			clearTimeout(mouseTimer);
		}
		svgElem.selectAll("g.viz_g").each(function(dIn){
			if(dIn.name === d.name){
				d3.select(this).style("opacity", 1).style("font-weight","bold");
			}else{
				d3.select(this).style("opacity", 0.1).style("font-weight","normal");
			}
		});
		if(isMobile){
			mouseTimer = setTimeout(namesMouseOut, 2000);
		}
	}
	
	function namesMouseOut(d){
		svgElem.selectAll("g.viz_g").style("opacity", 0.8).style("font-weight","normal");
	}
	
	function createChart(){
		let rectHeight = hSvg/(bottomRank * 1.5),
			fontSize = hSvg/(1.5 * bottomRank),
			barIndex,
			barG,
			firstG,
			secondG,
			midVal = Math.ceil(bottomRank/2),
			rectTextXAdjust, // it would we +/-5
			rectTextAnchor; // start/end
		
		if(fontSize > 24){
			fontSize = 24;
		}
		if(fontSize < 6){
			fontSize = 6;
		}
		svgElem = divElement.append("svg").attr("width", wSvg).attr("height", hSvg);
		firstG = svgElem.append("g");
		if(splitCase){
			secondG = svgElem.append("g")
								.attr("transform", "translate(" + (wSvg/2) + ", 0)");
			rectHeight = rectHeight*1.5;					
		}
		allNames.forEach(function(nc, ni){
			// dont' go beyond bottomRank
			if(ni >= bottomRank) return;
			barIndex = ni;
			barG = firstG;
			if(splitCase && ni >= midVal){
				barIndex = ni - midVal;
				barG = secondG;
			}
			
			let g = barG.append("g")
						.attr("class", "viz_g")
						.datum({"name":nc})
						.style("opacity", 0.8)
						.on("mouseover", namesMouseOver)
						.on("mouseout", namesMouseOut);

			g.append("text")
				.attr("x", scaleX(0) - 5)
				.attr("y", scaleY(barIndex + 1) + rectHeight/2)
				.attr("text-anchor", "end")
				.style("font-size", fontSize)
				.attr("dominant-baseline", "central")
				.text(nc);
				
			g.append("rect")
				.attr("x", scaleX(0))
				.attr("y", scaleY(barIndex + 1))
				.attr("width", scaleX(nameValueObj[nc]) - scaleX(0))
				.attr("height", rectHeight)
				.style("fill", barColor);
				
			if(nameValueObj[nc] > maxVal/2){
				rectTextXAdjust = -5;
				rectTextAnchor = "end";
			}else{
				rectTextXAdjust = +5;
				rectTextAnchor = "start";
			}
			
			g.append("text")
				.attr("x", scaleX(nameValueObj[nc]) + rectTextXAdjust)
				.attr("y", scaleY(barIndex + 1) + rectHeight/2)
				.attr("text-anchor", rectTextAnchor)
				.style("font-size", fontSize/1.2)
				.attr("dominant-baseline", "central")
				.text(format(nameValueObj[nc]));				
			
		});
							
	}
	understandData();
	resize();
}