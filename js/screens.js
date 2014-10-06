/**
 * @fileOverview This file defines the GameScreen class and its descendant
 * classes, which load and manipulate the DOM of the HTML pages and control
 * the rendering of scenes to the canvas elements.
 * @author <a href="mailto:nkrisztian89@gmail.com">Krisztián Nagy</a>
 * @version 0.1
 */

/**********************************************************************
    Copyright 2014 Krisztián Nagy
    
    This file is part of Interstellar Armada.

    Interstellar Armada is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Interstellar Armada is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Interstellar Armada.  If not, see <http://www.gnu.org/licenses/>.
 ***********************************************************************/

/**
 * Defines a GameScreen object.
 * @class Holds the logical model of a screen of the game. The different
 * screens should be defined as descendants of this class.
 * @param {String} name The name by which this screen can be identified.
 * @param {String} source The name of the HTML file where the structure of this
 * screen is defined.
 * @returns {GameScreen}
 */
function GameScreen(name,source) {
    // general properties
    this._name=name;
    this._source=source;
    this._model=null;
    
    // default components
    this._status=null;
    this._background=null;
    
    // function to execute when the model is loaded
    this._onModelLoad = function() {};
    
    var self = this;
    
    // source will be undefined when setting the prototypes for inheritance
    if(source!==undefined) {
        this.requestModelLoad();
    }
}

/**
 * Initiates the asynchronous loading of the screen's structure from the
 * external HTML file.
 */
GameScreen.prototype.requestModelLoad = function() {
    // send an asynchronous request to grab the HTML file containing the DOM of
    // this screen
    var request = new XMLHttpRequest();
    request.open('GET', location.pathname+this._source+"?123", true);
    var self = this;
    request.onreadystatechange = function() {
            self._model = document.implementation.createHTMLDocument(self._name);
            self._model.documentElement.innerHTML = this.responseText;
            self._onModelLoad();
        };
    request.send(null);
};

/**
 * Getter for the _name property.
 * @returns {String}
 */
GameScreen.prototype.getName = function() {
    return this._name;
};

/**
 * Replaces the current HTML page's body with the sctructure of the screen.
 */
GameScreen.prototype.buildPage = function() {
    var self = this;
    var buildPageFunction = function() {
        document.body=self._model.body.cloneNode(true);
        self._initializeComponents();
    };
    // if we have built up the model of the screen already, then load it
    if(this._model!==null) {
        buildPageFunction();
    // if not yet, set the callback function which fires when the model is 
    // loaded
    } else {
        this._onModelLoad = buildPageFunction;
    }
};

/**
 * Superimposes the screen on the current page, by appending a full screen
 * container and the screen structure as its child inside it.
 * @param {Number[3]} color The color of the full screen background. ([r,g,b],
 * where all color components should be 0-255)
 * @param {Number} opacity The opacity of the background (0.0-1.0)
 */
GameScreen.prototype.superimposeOnPage = function(color,opacity) {
    var self = this;
    var superimposeOnPageFunction = function() {
        self._background = document.createElement("div");
        self._background.className = "fullScreenFix";
        self._background.style.backgroundColor = "rgba("+color[0]+","+color[1]+","+color[2]+","+opacity+")";
        var container = document.createElement("div");
        container.className = "fullScreenContainer";
        container.innerHTML = self._model.body.innerHTML;
        document.body.appendChild(self._background);
        document.body.appendChild(container);
        self._initializeComponents();
    };
    // if we have built up the model of the screen already, then load it
    if(this._model!==null) {
        superimposeOnPageFunction();
    // if not yet, set the callback function which fires when the model is 
    // loaded
    } else {
        this._onModelLoad = superimposeOnPageFunction;
    }
};

/**
 * Tells whether the screen is superimposed on top of another one.
 * @returns {Boolean}
 */
GameScreen.prototype.isSuperimposed = function() {
    return this._background!==null;
};

/**
 * Executes the necessary actions required when closing the page. This method
 * only nulls out the default components, additional functions need to be added
 * in the descendant classes.
 */
GameScreen.prototype.closePage = function() {
    this._status = null;
};

/**
 * Closes the superimposed page by removing the background container next to
 * the regular page closing actions.
 */
GameScreen.prototype.closeSuperimposedPage = function() {
    if(!this.isSuperimposed()) {
        game.showError("Attempting to close a page ("+this._name+") as if it was superimposed, but in fact it is not.");
    } else {
        document.body.removeChild(this._background.nextSibling);
        document.body.removeChild(this._background);
        this._background = null;
        this.closePage();
    }
};

/**
 * Setting the properties that will be used to easier access DOM elements later.
 * In descendants, this method should be overwritten, adding the additional
 * components of the screen after calling this parent method.
 */
GameScreen.prototype._initializeComponents = function() {
    this._status = document.getElementById("status");
};

/**
 * Appends the elements of an external component (a HTML document fragment
 * defined in an external xml file) to the DOM tree and returns the same 
 * component.
 * @param {ScreenComponent} screenComponent
 * @param {Node} [parentNode] The node in the document to which to append the
 * component (if omitted, it will be appended to the body)
 * @returns {ScreenComponent}
 */
GameScreen.prototype.addExternalComponent = function(screenComponent,parentNode) {
    screenComponent.appendToPage(parentNode);
    return screenComponent;
};

/**
 * Provides visual information to the user about the current status of the game.
 * @param {String} newStatus The new status to display.
 */
GameScreen.prototype.updateStatus = function(newStatus) {
    if (this._status!==null) {
        this._status.innerHTML=newStatus;
    } else {
        alert(newStatus);
    }
};

/**
 * 
 * @param {String} name
 * @param {HTMLCanvasElement} canvas
 * @returns {ScreenCanvas}
 */
function ScreenCanvas(name,canvas) {
    this._name = name;
    this._canvas = canvas;
    this._resizeable = canvas.classList.contains("resizeable");
    this._context = null;
}

ScreenCanvas.prototype.getCanvasElement = function() {
    return this._canvas;
};

ScreenCanvas.prototype.isResizeable = function() {
    return this._resizeable;
};

ScreenCanvas.prototype.getManagedContext = function() {
    if(this._context === null) {
        this._context = new ManagedGLContext(this._canvas,game.graphicsContext.getAntialiasing());
    }
    return this._context;
};

/**
 * Defines a game screen with canvases object.
 * @class Represents a game screen that has one or more canvases where WebGL
 * scenes can be rendered.
 * @extends GameScreen
 * @param {String} name The name by which this screen can be identified.
 * @param {String} source The name of the HTML file where the structure of this
 * screen is defined.
 * @returns {GameScreenWithCanvases}
 */
function GameScreenWithCanvases(name,source) {
    GameScreen.call(this,name,source);
    
    this._canvases = new Object();
        
    this._sceneCanvasBindings = new Array();
    
    this._renderLoop = null;
    
    this._renderTimes = null;
    
    this._resizeEventListener = null;
};

GameScreenWithCanvases.prototype=new GameScreen();
GameScreenWithCanvases.prototype.constructor=GameScreenWithCanvases;

/**
 * Stops the render loop and nulls out the components.
 */
GameScreenWithCanvases.prototype.closePage = function() {
    GameScreen.prototype.closePage.call(this);
    
    this.stopRenderLoop();
    
    window.removeEventListener("resize",this._resizeEventListener);
    this._resizeEventListener = null;
    
    this._canvases = new Object();
        
    this._sceneCanvasBindings = new Array();
    
    game.graphicsContext.resourceManager.clearResourceContextBindings();
};

/**
 * Initializes the components of the parent class, then the additional ones for
 * this class (the canvases).
 */
GameScreenWithCanvases.prototype._initializeComponents = function() {
    GameScreen.prototype._initializeComponents.call(this);
    
    var canvasElements = document.getElementsByTagName("canvas");
    for(var i=0;i<canvasElements.length;i++) {
        this._canvases[canvasElements[i].getAttribute("id")] = new ScreenCanvas(
            canvasElements[i].getAttribute("id"),
            canvasElements[i]
        );
    }
    
    var self = this;
    this._resizeEventListener = function() { self.resizeCanvases.call(self); };
    window.addEventListener("resize",this._resizeEventListener);
};

GameScreenWithCanvases.prototype.getScreenCanvas = function(name) {
    return this._canvases[name];
}; 

/**
 * 
 * @param {Scene} scene
 * @param {ScreenCanvas} canvas
 */
GameScreenWithCanvases.prototype.bindSceneToCanvas = function(scene,canvas) {
    this._sceneCanvasBindings.push({
        scene: scene,
        canvas: canvas
    });
    scene.addToContext(canvas.getManagedContext());
};

/**
 * Renders the scenes displayed on this screen.
 */
GameScreenWithCanvases.prototype.render = function() {
    var i;
    for(i=0;i<this._sceneCanvasBindings.length;i++) {
        this._sceneCanvasBindings[i].scene.cleanUp();
        this._sceneCanvasBindings[i].scene.render(this._sceneCanvasBindings[i].canvas.getManagedContext());
    }
    var d = new Date();
    this._renderTimes.push(d);
    while((this._renderTimes.length>1)&&((d-this._renderTimes[0])>1000)) {
        this._renderTimes.shift();
    }
};

/**
 * Starts the render loop, by beginning to execute the render function every
 * interval milliseconds.
 * @param {Number} interval
 */
GameScreenWithCanvases.prototype.startRenderLoop = function(interval) {
    var i;
    for(i=0;i<this._sceneCanvasBindings.length;i++) {
        this._sceneCanvasBindings[i].canvas.getManagedContext().setupVertexBuffers(true);
    }
    var self = this;
    this._renderTimes = [new Date()];
    this._renderLoop = setInterval(function() { self.render(); },interval);
};

/**
 * Stops the render loop.
 */
GameScreenWithCanvases.prototype.stopRenderLoop = function() {
    clearInterval(this._renderLoop);
};

GameScreenWithCanvases.prototype.getFPS = function() {
    return this._renderTimes.length;
};

/**
 * Updates all needed variables when the screen is resized (camera perspective
 * matrices as well!)
 */
GameScreenWithCanvases.prototype.resizeCanvases = function() {
    var i;
    // first, update the canvas width and height properties if the client width/
    // height has changed
    for (var canvasName in this._canvases) {
        if(this._canvases[canvasName].isResizeable()===true) {
            var canvasElement = this._canvases[canvasName].getCanvasElement();
            var width = canvasElement.clientWidth;
            var height = canvasElement.clientHeight;
            if (canvasElement.width !== width ||
                    canvasElement.height !== height) {
                // Change the size of the canvas to match the size it's being displayed
                canvasElement.width = width;
                canvasElement.height = height;
            }
        }
    }
    // updated the variables in the scenes
    for (i = 0; i < this._sceneCanvasBindings.length; i++) {
        if(this._sceneCanvasBindings[i].canvas.isResizeable()===true) {
            this._sceneCanvasBindings[i].scene.resizeViewport(
                this._sceneCanvasBindings[i].canvas.getCanvasElement().width,
                this._sceneCanvasBindings[i].canvas.getCanvasElement().height
            );
        }
    }
};

/**
 * Defines a battle screen object.
 * @class Represents the battle screen.
 * @extends GameScreenWithCanvases
 * @param {String} name The name by which this screen can be identified.
 * @param {String} source The name of the HTML file where the structure of this
 * screen is defined.
 * @returns {BattleScreen}
 */
function BattleScreen(name,source) {
    GameScreenWithCanvases.call(this,name,source);
        
    this._stats=null;
    this._ui=null;
    
    this._loadingBox = new LoadingBox("loadingBox","loadingbox.html");
    this._infoBox = new InfoBox("infoBox","infobox.html");
};

BattleScreen.prototype=new GameScreenWithCanvases();
BattleScreen.prototype.constructor=BattleScreen;

/**
 * Nulls out the components.
 */
BattleScreen.prototype.closePage = function() {
    GameScreenWithCanvases.prototype.closePage.call(this);
    
    this._stats = null;
    this._ui = null;
    this._loadingBox.resetComponent();
    this._infoBox.resetComponent();
};

/**
 * Initializes the components of the parent class, then the additional ones for
 * this class.
 */
BattleScreen.prototype._initializeComponents = function() {
    GameScreenWithCanvases.prototype._initializeComponents.call(this);
    
    this._stats = document.getElementById("stats");
    this._ui= document.getElementById("ui");
    
    this.addExternalComponent(this._loadingBox);
    this.addExternalComponent(this._infoBox);
};

/**
 * Getter for the _loadingBox property.
 * @returns {LoadingBox}
 */
BattleScreen.prototype.getLoadingBox = function() {
    return this._loadingBox;
};

/**
 * Getter for the _infoBox property.
 * @returns {InfoBox}
 */
BattleScreen.prototype.getInfoBox = function() {
    return this._infoBox;
};

/**
 * Uses the loading box to show the status to the user.
 * @param {String} newStatus The status to show on the loading box. If
 * undefined, the status won't be updated.
 * @param {Number} newProgress The new value of the progress bar on the loading
 * box. If undefined, the value won't be updated.
 */
BattleScreen.prototype.updateStatus = function(newStatus,newProgress) {
    if(newStatus!==undefined) {
        this._loadingBox.updateStatus(newStatus);
    }
    if(newProgress!==undefined) {
        this._loadingBox.updateProgress(newProgress);
    }
};

/**
 * Hides the stats (FPS, draw stats) component.
 */
BattleScreen.prototype.hideStats = function() {
    this._stats.style.display="none";
};

/**
 * Hides the UI (information about controlled spacecraft) component.
 */
BattleScreen.prototype.hideUI = function() {
    this._ui.style.display="none";
};

/**
 * Shows the stats (FPS, draw stats) component.
 */
BattleScreen.prototype.showStats = function() {
    this._stats.style.display="block";
};

/**
 * Shows the UI (information about controlled spacecraft) component.
 */
BattleScreen.prototype.showUI = function() {
    this._ui.style.display="block";
};

/**
 * Shows the given message to the user in an information box.
 * @param {String} message
 */
BattleScreen.prototype.showMessage = function(message) {
    this._infoBox.updateMessage(message);
    this._infoBox.show();
};

BattleScreen.prototype.render = function() {
    GameScreenWithCanvases.prototype.render.call(this);
    this._stats.innerHTML = this.getFPS()+"<br/>"+this._sceneCanvasBindings[0].scene.getNumberOfDrawnTriangles();
};

BattleScreen.prototype.startNewBattle = function(levelSourceFilename) {
    this.hideStats();
    this.hideUI();
    this.getInfoBox().hide();
    this.resizeCanvases(); 
    
    var test_level = new Level();
    game.logicContext.level = test_level;
    
    var self = this;
    
    test_level.onLoad = function () {
        self.updateStatus("loading additional configuration...", 5);
        test_level.addRandomShips("human",{falcon: 30, viper: 10, aries: 5, taurus: 10}, 3000);
        
        self.updateStatus("building scene...",10);
        var canvas = self.getScreenCanvas("battleCanvas").getCanvasElement();
        game.graphicsContext.scene = new Scene(0,0,canvas.width,canvas.height,true,[true,true,true,true],[0,0,0,1],true,game.graphicsContext.getLODContext());
        test_level.buildScene(game.graphicsContext.scene);

        self.updateStatus("loading graphical resources...",15);
        game.graphicsContext.resourceManager.onResourceLoad = function(resourceName,totalResources,loadedResources) {
            self.updateStatus("loaded "+resourceName+", total progress: "+loadedResources+"/"+totalResources,20+(loadedResources/totalResources)*60);
        };
        var freq = 60;
        game.graphicsContext.resourceManager.executeWhenReady(function() { 
            self.updateStatus("initializing WebGL...",75);
            self.bindSceneToCanvas(game.graphicsContext.scene,self.getScreenCanvas("battleCanvas"));
            test_level.addProjectileResourcesToContext(self.getScreenCanvas("battleCanvas").getManagedContext());
            self.updateStatus("",100);
            self.showMessage("Ready!");
            self.getLoadingBox().hide();
            self.showStats();
            self.startRenderLoop(1000/freq);
        });
        
        game.graphicsContext.resourceManager.requestResourceLoad();

        var globalCommands = initGlobalCommands(game.graphicsContext, game.logicContext, game.controlContext);
        game.controlContext.activate();

        prevDate = new Date();
        
        battleSimulationLoop = setInterval(function ()
        {
            var i;
            curDate = new Date();
            test_level.tick(curDate - prevDate);
            prevDate = curDate;
            control(game.graphicsContext.scene, test_level, globalCommands);
            if (game.graphicsContext.lightIsTurning) {
                var rotMatrix = rotationMatrix4([0.0,1.0,0.0],0.07);
                for(i=0;i<test_level.backgroundObjects.length;i++) {
                    test_level.backgroundObjects[i].position = vector3Matrix4Product(test_level.backgroundObjects[i].position,rotMatrix);
                }                
            }
        }, 1000 / freq);
    };
    
    self.updateStatus("loading level information...",0);
    test_level.requestLoadFromFile(levelSourceFilename);
};

/**
 * Defines a help screen object.
 * @class Represents the help screen, which currently just shows the available
 * keyboard controls.
 * @extends GameScreen
 * @param {String} name Check GameScreen
 * @param {String} source Check GameScreen
 * @returns {HelpScreen}
 */
function HelpScreen(name,source) {
    GameScreen.call(this,name,source);
};

HelpScreen.prototype=new GameScreen();
HelpScreen.prototype.constructor=HelpScreen;

/**
 * Builds the dynamic part of the HTML structure, adding the table rows to list
 * the set key commands.
 */
HelpScreen.prototype._initializeComponents = function() {
    GameScreen.prototype._initializeComponents.call(this);
    
    var backButton = document.getElementById("backButton");
    backButton.addEventListener("click",function(){
        if(game.getCurrentScreen().isSuperimposed()) {
            game.closeSuperimposedScreen();
        } else {
            game.setCurrentScreen('mainMenu');
        }
    });
    
    var keyCommandsTable = document.getElementById("keyCommandsTable");
    var keyCommands = game.controlContext.getCommandExplanationsAndKeys();
    var trElement = null;
    for(var i=0;i<keyCommands.length;i++) {
        trElement = document.createElement("tr");
        trElement.innerHTML="<td>"+keyCommands[i][1]+"</td><td>"+keyCommands[i][0]+"</td>";
        keyCommandsTable.appendChild(trElement);
    }
};

/**
 * Defines a menu screen object.
 * @class A game screen with a {@link MenuComponent}.
 * @extends GameScreen
 * @param {String} name @see {@link GameScreen}
 * @param {String} source @see {@link GameScreen}
 * @param {Object[]} menuOptions The menuOptions for creating the {@link MenuComponent}
 * @param {String} [menuContainerID] The ID of the HTML element inside of which
 * the menu should be added (if omitted, it will be appended to body)
 * @returns {MenuScreen}
 */
function MenuScreen(name,source,menuOptions,menuContainerID) {
    GameScreen.call(this,name,source);
    
    /**
     * @see MenuComponent
     * @name MenuScreen#_menuOptions 
     * @type Object[]
     */
    this._menuOptions = menuOptions;
    /**
     * The ID of the HTML element inside of which the menu will be added. If
     * undefined, it will be appended to the document body.
     * @name MenuScreen#_menuContainerID 
     * @type String
     */
    this._menuContainerID = menuContainerID;
    /**
     * The component generating the HTML menu.
     * @name MenuScreen#_menuComponent 
     * @type MenuComponent
     */
    this._menuComponent = new MenuComponent("menu","menucomponent.html",this._menuOptions);
};

MenuScreen.prototype=new GameScreen();
MenuScreen.prototype.constructor=MenuScreen;

/**
 * Builds up the HTML menu on the page using the {@link MenuComponent}
 */
MenuScreen.prototype._initializeComponents = function() {
    GameScreen.prototype._initializeComponents.call(this);
    
    var parentNode;
    if(this._menuContainerID!==undefined) {
        parentNode = document.getElementById(this._menuContainerID);
    }
    // otherwise just leave it undefined, nothing to pass to the method below
    
    this.addExternalComponent(this._menuComponent,parentNode);
};

/**
 * Nulls out the components.
 */
MenuScreen.prototype.closePage = function() {
    GameScreen.prototype.closePage.call(this);
    
    this._menuComponent.resetComponent();
};