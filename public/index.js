const defaultLocale = 'en-US';

function requestChatBot(loc) {
    const params = new URLSearchParams(location.search);
    const oReq = new XMLHttpRequest();
    oReq.addEventListener("load", initBotConversation);
    var path = "/chatBot?locale=" + extractLocale(params.get('locale'));

    if (loc) {
        path += "&lat=" + loc.lat + "&long=" + loc.long;
    }
    if (params.has('userId')) {
        path += "&userId=" + params.get('userId');
    }
    if (params.has('userName')) {
        path += "&userName=" + params.get('userName');
    }
    oReq.open("POST", path);
    oReq.send();
}

function extractLocale(localeParam) {
    if (!localeParam) {
        return defaultLocale;
    }
    else if (localeParam === 'autodetect') {
        return navigator.language;
    }
    else {
        return localeParam;
    }
}

function chatRequested() {
    const params = new URLSearchParams(location.search);
    if (params.has('shareLocation')) {
        getUserLocation(requestChatBot);
    }
    else {
        requestChatBot();
    }
}

function getUserLocation(callback) {
    navigator.geolocation.getCurrentPosition(
        function(position) {
            var latitude  = position.coords.latitude;
            var longitude = position.coords.longitude;
            var location = {
                lat: latitude,
                long: longitude
            }
            callback(location);
        },
        function(error) {
            // user declined to share location
            console.log("location error:" + error.message);
            callback();
        });
}

function initBotConversation() {
    if (this.status >= 400) {
        alert(this.statusText);
        return;
    }
    // extract the data from the JWT
    const jsonWebToken = this.response;
    const tokenPayload = JSON.parse(atob(jsonWebToken.split('.')[1]));
    const user = {
        id: tokenPayload.userId,
        name: tokenPayload.userName,
        locale: tokenPayload.locale
    };
    let domain = undefined;
    if (tokenPayload.directLineURI) {
        domain =  "https://" +  tokenPayload.directLineURI + "/v3/directline";
    }
    let location = undefined;
    if (tokenPayload.location) {
        location = tokenPayload.location;
    } else {
        // set default location if desired
        /*location = {
            lat: 44.86448450671394,
            long: -93.32597021107624
        }*/
    }
    var botConnection = window.WebChat.createDirectLine({
        token: tokenPayload.connectorToken,
        domain: domain
    });


    const styleSet = window.WebChat.createStyleSet({
        paddingRegular: 16,
        // paddingWide: '16px 24px',
        bubbleBackground: '#f3efe6',
        bubbleBorderColor: 'transparent',
        bubbleBorderRadius: '24px 24px 24px 8px',
        bubbleBorderStyle: 'solid',
        bubbleBorderWidth: 1,
        bubbleFromUserBackground: '#57C5BF',
        bubbleFromUserBorderColor: 'transparent',
        bubbleFromUserBorderRadius: '24px 24px 8px 24px',
        bubbleFromUserBorderStyle: 'solid',
        bubbleFromUserBorderWidth: 0,
        bubbleFromUserNubOffset: 0,
        bubbleFromUserNubSize: undefined,
        bubbleFromUserTextColor: 'white',
        bubbleImageHeight: 240,
        bubbleMaxWidth: 480, // Based off screen width = 600px
        bubbleMinHeight: 0,
        bubbleMinWidth: 250, // min screen width = 300px; Microsoft Edge requires 372px (https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/13621468/)
        bubbleNubOffset: 0,
        bubbleNubSize: undefined,
        bubbleTextColor: '#272625',
        messageActivityWordBreak: 'break-word',


        // Suggested actions
        suggestedActionBackground: 'transparent',
        suggestedActionBorderColor: '#57C6BE',
        suggestedActionBorderRadius: 24,
        suggestedActionBorderStyle: 'solid',
        suggestedActionBorderWidth: 3,
        suggestedActionDisabledBackground: undefined,
        suggestedActionDisabledBorderColor: '#E6E6E6',
        suggestedActionDisabledBorderStyle: 'solid',
        suggestedActionDisabledBorderWidth: 2,
        suggestedActionDisabledTextColor: undefined,
        suggestedActionHeight: 55,
        suggestedActionImageHeight: 20,
        suggestedActionLayout: 'carousel',
        suggestedActionTextColor: '#57C6BE',

        transcriptActivityVisualKeyboardIndicatorColor: 'transparent',
        transcriptVisualKeyboardIndicatorWidth: 0,

        // Send box
        hideSendBox: false,
        hideUploadButton: false,
        microphoneButtonColorOnDictate: '#F33',
        sendBoxBackground: 'white',
        sendBoxButtonColor: '#57C6BE',
        sendBoxButtonColorOnDisabled: '#CCC',
        sendBoxButtonColorOnFocus: '#57C6BE',
        sendBoxButtonColorOnHover: '#57C6BE',
        sendBoxDisabledTextColor: undefined,
        sendBoxHeight: 80,
        sendBoxMaxHeight: 200,
        sendBoxTextColor: 'Black',
        sendBoxButtonShadeBorderRadius: '50%',
        sendBoxButtonShadeColor: undefined,
        sendBoxButtonShadeColorOnActive: "#EDEBE9",
        sendBoxButtonShadeColorOnDisabled: "#F3F2F1",
        sendBoxButtonShadeColorOnFocus: undefined,
        sendBoxButtonShadeColorOnHover: "#F3F2F1",
        sendBoxButtonShadeInset: 10,
    });

    styleSet.sendBox = Object.assign({}, styleSet.sendBox, {
        boxShadow: '0 0px 24px 0 rgb(85 80 67 / 10%)'
    })

    styleSet.textContent = Object.assign({}, styleSet.textContent, {

    });

    const styleOptions = {
        botAvatarImage: ' ',
        // botAvatarInitials: '',
        // userAvatarImage: '',
        hideSendBox: false, /* set to true to hide the send box from the view */
        botAvatarInitials: 'Bot',
        userAvatarInitials: 'You',
        backgroundColor: '#F8F8F8',
        bubbleBackground: '#f3efe6',
        bubbleFromUserBackground: '#57C5BF'
    };

    const store = window.WebChat.createStore({}, function(store) { return function(next) { return function(action) {
        if (action.type === 'DIRECT_LINE/CONNECT_FULFILLED') {
            store.dispatch({
                type: 'DIRECT_LINE/POST_ACTIVITY',
                meta: {method: 'keyboard'},
                payload: {
                    activity: {
                        type: "invoke",
                        name: "InitConversation",
                        locale: user.locale,
                        value: {
                            // must use for authenticated conversation.
                            jsonWebToken: jsonWebToken,

                            // Use the following activity to proactively invoke a bot scenario
                            /*
                            triggeredScenario: {
                                trigger: "{scenario_id}",
                                args: {
                                    location: location,
                                    myVar1: "{custom_arg_1}",
                                    myVar2: "{custom_arg_2}"
                                }
                            }
                            */
                        }
                    }
                }
            });

            debugger
            store.dispatch({
                type: 'WEB_CHAT/SEND_MESSAGE',
                payload: {
                    channelData: undefined,
                    method: "keyboard",
                    text: "Hi"
                }
            });

        }
        else if (action.type === 'DIRECT_LINE/INCOMING_ACTIVITY') {
            if (action.payload && action.payload.activity && action.payload.activity.type === "event" && action.payload.activity.name === "ShareLocationEvent") {
                // share
                getUserLocation(function (location) {
                    store.dispatch({
                        type: 'WEB_CHAT/SEND_POST_BACK',
                        payload: { value: JSON.stringify(location) }
                    });
                });
            }
        }
        return next(action);
    }}});
    const webchatOptions = {
        directLine: botConnection,
        store: store,
        userID: user.id,
        username: user.name,
        locale: user.locale,
        styleSet: styleSet
    };
    startChat(user, webchatOptions);
}

function startChat(user, webchatOptions) {
    const botContainer = document.getElementById('webchat');
    const webChat = window.WebChat.renderWebChat(webchatOptions, botContainer);
    debugger;
}
