from selenium import webdriver
import json

def describe(driver, selector='*'):
    elements = driver.execute_script(f'return document.querySelectorAll("{selector}");')
    result = []

    for element in elements:
        # Check if jQuery is defined and get jQuery event listeners if available
        jquery_listeners = None
        is_jquery_defined = driver.execute_script('return typeof jQuery !== "undefined";')
        if is_jquery_defined:
            jquery_listeners = driver.execute_script('return jQuery._data(arguments[0], "events");', element)
        
        # Get native JavaScript event listeners
        native_listeners = driver.execute_script('''
            var events = {};
            var element = arguments[0];
            var attributes = element.attributes;
            for (var i = 0; i < attributes.length; i++) {
                var attr = attributes[i];
                if (attr.name.startsWith('on')) {
                    var event_type = attr.name.substring(2);
                    events[event_type] = element[event_type];
                }
            }
            return events;
        ''', element)
        print(native_listeners) 
        
        if jquery_listeners or native_listeners:
            result.append({
                'element': element,
                'jquery_listeners': jquery_listeners,
                'native_listeners': native_listeners
            })

    return result

def get_function_code(driver, element, event_type, is_jquery=True):
    if is_jquery:
        function_code = driver.execute_script(
            'return jQuery._data(arguments[0], "events")[arguments[1]][0].handler.toString();',
            element, event_type
        )
    else:
        function_code = driver.execute_script(
            'return arguments[0][arguments[1]].toString();',
            element, event_type
        )
    return function_code

# Start the browser and navigate to the page
driver = webdriver.Chrome()
driver.get('https://clazgate.com')

# Describe the elements and their event listeners
result = describe(driver)

output = {}
for item in result:
    element = item['element']
    descriptor = element.tag_name
    if element.get_attribute('id'):
        descriptor += f'#{element.get_attribute("id")}'
    if element.get_attribute('class'):
        descriptor += f'.{element.get_attribute("class").replace(" ", ".")}'

    listener_details = []

    # Process jQuery listeners
    if item['jquery_listeners']:
        for event_type in item['jquery_listeners']:
            function_code = get_function_code(driver, element, event_type, is_jquery=True)
            listener_details.append({
                'type': event_type,
                'handler': {
                    'function_code': function_code
                },
                'library': 'jQuery'
            })

    # Process native JavaScript listeners
    if item['native_listeners']:
        for event_type, handler in item['native_listeners'].items():
            if handler:  # Only include if there's an actual handler
                function_code = get_function_code(driver, element, 'on' + event_type, is_jquery=False)
                listener_details.append({
                    'type': event_type,
                    'handler': {
                        'function_code': function_code
                    },
                    'library': 'native'
                })

    output[descriptor] = listener_details

# Write output to a file
with open('output2.json', 'w') as f:
    json.dump(output, f, indent=2)

# Close the browser
driver.quit()

