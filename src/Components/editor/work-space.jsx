import { fabric } from "fabric";
import Controls from "./controls";
import { useDrop } from "react-dnd";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "noval";
import { controlsInfo } from "./controls/helper";
import { FabricJSCanvas, useFabricJSEditor } from "fabricjs-react";

const WorkSpace = ({ size, imgUrl, defaultData, isControlled = true }) => {
  const loaded = useRef(null);
  const canvasRef = useRef(null);
  const { dispatch, reset } = useDispatch();
  const mainEditor = useSelector("mainEditor");
  const { editor, onReady } = useFabricJSEditor();

  const setCurrentShape = (group) => {
    if (Array.isArray(group?._objects)) {
      const shape = group?._objects?.[0];
      const element1 = group?._objects?.[1];
      const element2 = group?._objects?.[2];
      dispatch(
        {
          active: true,
          color: shape.fill,
          value: element2?.text,
          name: element1?.text,
        },
        "currentShape"
      );
      group.on("scaling", () => {
        const scaleX = 1 / group.scaleX;
        const scaleY = 1 / group.scaleY;
        element1.set({ scaleX, scaleY });
        element2.set({ scaleX, scaleY });
        mainEditor?.canvas.renderAll();
      });
    }
  };

  const clearCurrentShape = (group) => {
    dispatch(
      {
        active: false,
      },
      "currentShape"
    );
    group.off("scaling");
  };

  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: ["rect", "circle", "triangle"],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    drop: () => {
      return { name: "floorBox", canvas: canvasRef.current };
    },
  }));

  useEffect(() => {
    if (mainEditor?.canvas && size?.width && !loaded?.current) {
      loaded.current = true;
      console.log("🚀 ~ useEffect ~ isControlled:", isControlled);
      mainEditor?.canvas?.setWidth(size?.width);
      mainEditor?.canvas?.setHeight(size?.height);
      fabric.Object.prototype.cornerStyle = "circle";
      fabric.Object.prototype.cornerColor = "#1481ff";
      controlsInfo.forEach(({ name, state }) => {
        fabric.Object.prototype.setControlVisible(name, state);
      });
      defaultData && mainEditor?.canvas.loadFromJSON(defaultData);
      mainEditor.canvas.on("selection:created", ({ selected }) => {
        setCurrentShape(selected?.[0]);
      });
      mainEditor.canvas.on("selection:updated", ({ selected, deselected }) => {
        clearCurrentShape(deselected?.[0]);
        setCurrentShape(selected?.[0]);
      });
      mainEditor.canvas.on("selection:cleared", ({ deselected }) => {
        clearCurrentShape(deselected?.[0]);
      });
    }
  }, [mainEditor, size, defaultData]);

  useEffect(() => {
    dispatch({ mainEditor: editor });
    return () => reset("mainEditor");
  }, [editor]);

  return (
    <div className="flex flex-col gap-2 relative">
      <Controls isControlled={isControlled} />
      <div className="relative" ref={dropRef} role="floorBox">
        <div
          style={{ size }}
          className={`sample-canvas atheel absolute overflow-hidden rounded-xl border ${
            isOver ? "opacity-60 border-2 border-dashed border-[red]" : ""
          }`}
        >
          <img src={imgUrl} width={size?.width} height={size?.height} />
        </div>
        <FabricJSCanvas
          onReady={(e) => {
            dispatch({ mainEditor: editor });
            canvasRef.current = e?.upperCanvasEl;
            onReady(e);
          }}
          ref={canvasRef}
          className={`sample-canvas atheel overflow-hidden`}
        />
      </div>
      {isControlled ? null : (
        <div className="absolute top-0 left-0 bottom-0 right-0 z-50" />
      )}
    </div>
  );
};

export default WorkSpace;
