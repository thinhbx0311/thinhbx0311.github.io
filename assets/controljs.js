

var valueSlider = 00;
$(document).ready(function () {
    var speakerON = true;

    // // Internet Explorer 6-11
    // var isIE = /*@cc_on!@*/false || !!document.documentMode;
    // // Edge 20+
    // var isEdge = !isIE && !!window.StyleMedia;
    // if (isIE || isEdge) {
    //     alert("The browser which you're using is not fully-supported. Switch to another browser to continue.");
    //     $('body').css('display', 'none');
    // }
    $("#select-a-car").on("click tap", function () {
        $(".select-list-car").toggleClass('list-car-active');
    });
    $(".button-select").on("click tap", function () {
        $("#select-a-car").text(jQuery(this).text().trim());
        $(".select-list-car").toggleClass('list-car-active');
    })
    function closedButton() {
        $(".button-bottom").toggleClass("button-bottom-hide");
        $(".slider").css("display", "none");
    }
    $(".function-button").on("click tap", function () {
        closedButton();
    });
    $("#slider-button").on("click tap", function () {
        if ($(".select-list-car").hasClass('list-car-active')) $(".select-list-car").toggleClass(
            'list-car-active');
        $(".slider").css("display", "block");
    });
    $('.slider-input').on("input change", function () {
        valueSlider = $(this).val();
        fn1(valueSlider);
        if (valueSlider > 10) {
            turnRight1();
        }
        else if (valueSlider < 10) {
            turnLeft1();
        }
        else {
            normalLight();
        }
    });
    $('.button-select').width($('#select-a-car').width());
    $('.button-select').css('min-width', '139px');
    $("#speaker-button").on("click tap", function speakerActive() {
        if (speakerON) {
            $("#speaker-button").html("<i class='fas fa-volume-off' style= 'padding-bottom: 1.5px;'>&nbsp</i>");
            speakerON = false;
        } else {
            $("#speaker-button").html("<i class='fas fa-volume-up' style= 'padding-bottom: 1.5px;'>&nbsp</i>");
            speakerON = true;
        }
    });
});


